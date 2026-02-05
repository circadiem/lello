import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase (Service Role needed for secure backend ops if we were doing admin stuff, 
// but standard client is fine if we pass the user token. For simplicity, we'll use standard env vars)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { text, userId, readers } = await req.json();

    if (!text || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Construct the Prompt
    // We give Gemini the list of valid readers to ensure it maps "he" to the right kid if mentioned by name.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are a library assistant. Extract the reading data from this text: "${text}".
      
      Context:
      - Valid readers: ${JSON.stringify(readers)}
      - Today's date: ${new Date().toISOString()}
      
      Rules:
      - Match the 'reader' to one of the valid readers if possible. If uncertain, use the first valid reader.
      - Extract the 'book_title'.
      - Extract 'notes' if there is sentiment (e.g. "loved it").
      
      Return ONLY a JSON object with this schema:
      {
        "book_title": "string",
        "reader_name": "string",
        "notes": "string or null"
      }
    `;

    // 2. Ask Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanText = response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanText);

    // 3. Insert into Supabase
    // Ideally, we'd also fuzz-match the book title against their library here to get the author.
    // For MVP, we'll log what Gemini found.
    const { data: log, error } = await supabase
      .from('reading_logs')
      .insert({
        user_id: userId,
        book_title: data.book_title,
        book_author: "Unknown (Magic Log)", // V2: Ask Google Books API for this
        reader_name: data.reader_name || readers[0],
        notes: data.notes,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, log });

  } catch (error: any) {
    console.error('Magic Log Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
