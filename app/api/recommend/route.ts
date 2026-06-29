import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAuthedClient } from '@/lib/authedClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // CHANGED: user comes from the verified JWT, not the request body.
    const { supabase, userId } = await getAuthedClient(req);

    const { query } = await req.json();

    // 1. Fetch context (RLS already restricts these to this user, the
    //    .eq is just belt-and-suspenders / clarity).
    const { data: logs } = await supabase
      .from('reading_logs')
      .select('book_title, count')
      .eq('user_id', userId);
    const { data: library } = await supabase
      .from('library')
      .select('title')
      .eq('user_id', userId);

    const bookCounts: Record<string, number> = {};
    logs?.forEach((log: any) => {
      const val = log.count || 1;
      bookCounts[log.book_title] = (bookCounts[log.book_title] || 0) + val;
    });

    const topBooks = Object.entries(bookCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([title]) => title);

    const ownedTitles = library?.map((b: any) => b.title) || [];

    // 2. Prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      Act as an expert children's librarian.
      User Request: "${query || 'Suggest something new based on what we read.'}"

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

    // 3. Execute & parse
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let recommendations;
    try {
      recommendations = JSON.parse(text);
    } catch (e) {
      console.error('JSON Parse Failed:', text);
      throw new Error('The Librarian returned invalid data. Please try again.');
    }

    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    // getAuthedClient throws a Response for auth failures — pass it through.
    if (error instanceof Response) return error;
    console.error('Discover Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
