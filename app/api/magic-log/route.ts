import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAuthedClient } from '@/lib/authedClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // CHANGED: user comes from the verified JWT, not the request body.
    const { supabase, userId } = await getAuthedClient(req);

    const { text, readers } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // 1. Extract structured data from the natural-language note.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' },
    });

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
      { "book_title": "string", "reader_name": "string", "notes": "string or null" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanText = response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanText);

    // 2. Enrich: try to resolve a real author from Google Books so the
    //    log doesn't store "Unknown". Best-effort — failures are fine.
    let author = 'Unknown';
    try {
      const gbKey = process.env.GOOGLE_BOOKS_API_KEY; // server-only key (no NEXT_PUBLIC_)
      const url =
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(data.book_title)}` +
        `&maxResults=1&printType=books${gbKey ? `&key=${gbKey}` : ''}`;
      const gb = await fetch(url);
      if (gb.ok) {
        const gbData = await gb.json();
        const info = gbData.items?.[0]?.volumeInfo;
        if (info?.authors?.length) author = info.authors[0];
      }
    } catch {
      /* keep 'Unknown' */
    }

    // 3. Insert (RLS ties this to the authed user).
    const { data: log, error } = await supabase
      .from('reading_logs')
      .insert({
        user_id: userId,
        book_title: data.book_title,
        book_author: author,
        reader_name: data.reader_name || readers?.[0] || 'Reader',
        notes: data.notes,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Magic Log Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
