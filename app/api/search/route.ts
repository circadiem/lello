import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (Safe check)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // 1. Validate Environment
    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
    if (!googleKey) {
        console.error("SEARCH ERROR: Missing NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY");
        // Don't crash, return empty array so frontend doesn't show "SyntaxError"
        return NextResponse.json({ results: [] }); 
    }

    if (!query) return NextResponse.json({ results: [] });

    // 2. Fetch from Google Books
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${googleKey}&maxResults=35&printType=books`;
    const res = await fetch(googleUrl);
    
    if (!res.ok) {
        return NextResponse.json({ results: [] });
    }

    const googleData = await res.json();
    
    if (!googleData.items) {
        return NextResponse.json({ results: [] });
    }

    // 3. Normalize & Filter
    const candidates = googleData.items
      .filter((item: any) => {
          const info = item.volumeInfo;
          // RELAXED FILTER: Accept either regular thumbnail OR smallThumbnail
          const hasImage = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
          return info.title && info.authors && hasImage; 
      })
      .map((item: any) => {
          const img = item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || '';
          return {
              id: item.id,
              title: item.volumeInfo.title,
              author: item.volumeInfo.authors[0],
              // Safety: Ensure we replace http with https
              coverUrl: img.replace('http:', 'https:'),
              popularity: item.volumeInfo.ratingsCount || 0,
              rating: item.volumeInfo.averageRating || 0
          };
      });

    // 4. AI Sort (The "Smart" Layer)
    if (genAI && candidates.length > 0) {
        try {
            // FIX FOR LINE 65: Prepare list OUTSIDE the template literal
            const simplifiedList = candidates.map((c: any) => ({ 
                id: c.id, 
                title: c.title, 
                author: c.author 
            }));

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const prompt = `
              Re-rank this book list based on relevance to query: "${query}".
              Prioritize exact title matches and classic editions.
              List: ${JSON.stringify(simplifiedList)}
              Return JSON ONLY: { "rankedIds": ["id1", "id2"] }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(text);
            
            if (parsed.rankedIds) {
                const sorted = parsed.rankedIds
                    .map((id: string) => candidates.find((c: any) => c.id === id))
                    .filter(Boolean);
                const remaining = candidates.filter((c: any) => !parsed.rankedIds.includes(c.id));
                return NextResponse.json({ results: [...sorted, ...remaining] });
            }
        } catch (e) {
            console.warn("AI Sort Failed (Falling back to popularity):", e);
            // Do nothing, code proceeds to fallback sort below
        }
    }

    // 5. Fallback Sort (Popularity)
    candidates.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
    
    return NextResponse.json({ results: candidates });

  } catch (error: any) {
    console.error('SEARCH CRITICAL FAILURE:', error);
    // Return empty array instead of 500 so frontend doesn't crash
    return NextResponse.json({ results: [] }); 
  }
}
