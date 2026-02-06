import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json();

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // 1. Fetch Context
    const { data: logs } = await supabase.from('reading_logs').select('book_title, count').eq('user_id', userId);
    const { data: library } = await supabase.from('library').select('title').eq('user_id', userId);

    const bookCounts: Record<string, number> = {};
    logs?.forEach((log: any) => {
        const val = log.count || 1; 
        bookCounts[log.book_title] = (bookCounts[log.book_title] || 0) + val;
    });
    
    const topBooks = Object.entries(bookCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([title]) => title);

    const ownedTitles = library?.map((b: any) => b.title) || [];

    // 2. Construct Prompt (Using your preferred model)
    // We explicitly request 'application/json' to help the model format correctly
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" } 
    });
    
    const prompt = `
      Act as an expert children's librarian.
      User Request: "${query || "Suggest something new based on what we read."}"
      
      Context:
      - They frequently read (Heavy Rotation): ${topBooks.join(', ')}.
      - Do NOT suggest these books (Already Owned): ${ownedTitles.slice(0, 50).join(', ')}...
      
      Task:
      Recommend exactly 5 books (unless the user asked for a specific number).
      For each book, provide a title, author, and a SHORT, custom "reason" blurb explaining why it fits.
      
      Return JSON ONLY:
      [
        { "title": "String", "author": "String", "reason": "Because you read X, you might like Y..." }
      ]
    `;

    // 3. Execute & Parse
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Aggressive Cleanup: Remove markdown blocks if they exist
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Safety Parser
    let recommendations;
    try {
        recommendations = JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Failed:", text);
        throw new Error("The Librarian returned invalid data. Please try again.");
    }

    return NextResponse.json({ success: true, recommendations });

  } catch (error: any) {
    console.error('Discover Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
