import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    // 1. FAIL SAFE: If key is missing, don't crash. Show a "Book" telling us.
    if (!googleKey) {
        console.error("SERVER: Missing Google API Key");
        return NextResponse.json({ 
            results: [{
                id: 'error-key',
                title: "⚠️ Configuration Error",
                author: "Missing Google API Key on Vercel",
                coverUrl: null,
                rating: 0,
                popularity: 0
            }]
        });
    }

    if (!query) return NextResponse.json({ results: [] });

    // 2. SEARCH
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${googleKey}&maxResults=20&printType=books`);
    
    if (!res.ok) {
        return NextResponse.json({ 
            results: [{
                id: 'error-google',
                title: `⚠️ Google Error: ${res.status}`,
                author: "Check Quota or Key Validity",
                coverUrl: null,
                rating: 0,
                popularity: 0
            }]
        });
    }

    const data = await res.json();
    
    if (!data.items) return NextResponse.json({ results: [] });

    // 3. MAP
    const results = data.items.map((item: any) => {
        const info = item.volumeInfo || {};
        const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
        
        return {
            id: item.id,
            title: info.title || "Untitled",
            author: info.authors ? info.authors[0] : "Unknown",
            coverUrl: img ? img.replace('http:', 'https:') : null,
            popularity: info.ratingsCount || 0,
            rating: info.averageRating || 0
        };
    });

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ 
        results: [{
            id: 'error-crash',
            title: "⚠️ Server Crash",
            author: error.message,
            coverUrl: null,
            rating: 0,
            popularity: 0
        }]
    });
  }
}
