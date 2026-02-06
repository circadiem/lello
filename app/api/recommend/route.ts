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

    // 1. Fetch Context: Heavy Rotation & Library
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

    // 2. Construct the Prompt
    // UPDATED: Using 'gemini-2.5-flash-lite', the cost-effective workhorse.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `
      Act as an expert children's librarian.
      User Request: "${query || "Suggest something new based on what we read."}"
      
      Context:
      - They frequently read (Heavy Rotation): ${topBooks.join(', ')}.
      - Do NOT suggest these books (Already Owned): ${ownedTitles.slice(0, 50).join(', ')}...
      
      Task:
      Recommend exactly 5 books (unless the user asked for a specific number).
      For each book, provide a title, author, and a SHORT, custom "reason" blurb explaining why it fits their Heavy Rotation or specific request.
      
      Return JSON ONLY:
      [
        { "title": "String", "author": "String", "reason": "Because you read X, you might like Y..." }
      ]
    `;

    // 3. Ask Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown code blocks if present
    text = text.replace(/```json|```/g, '').trim();
    
    // Improved Cleaning: Find the first '[' and the last ']'
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
    }
    
    const recommendations = JSON.parse(text);

    return NextResponse.json({ success: true, recommendations });

  } catch (error: any) {
    console.error('Discover Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
