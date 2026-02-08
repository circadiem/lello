import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    // 1. Fail fast if no key
    if (!googleKey) {
        console.error("SERVER ERROR: Missing Google Books API Key");
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    if (!query) return NextResponse.json({ results: [] });

    // 2. Direct Proxy to Google Books (No AI, No Complex Logic)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${googleKey}&maxResults=20&printType=books`);
    
    if (!res.ok) {
        console.error(`Google API Error: ${res.status}`);
        return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    
    if (!data.items) {
        return NextResponse.json({ results: [] });
    }

    // 3. Simple Mapping
    const cleanResults = data.items.map((item: any) => {
        const info = item.volumeInfo || {};
        // Grab the best image available
        const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
        
        return {
            id: item.id,
            title: info.title || "Untitled",
            author: info.authors ? info.authors[0] : "Unknown Author",
            // Force HTTPS
            coverUrl: img ? img.replace('http:', 'https:') : null,
            description: info.description || "",
            pageCount: info.pageCount || 0,
            popularity: info.ratingsCount || 0,
            rating: info.averageRating || 0
        };
    });

    return NextResponse.json({ results: cleanResults });

  } catch (error: any) {
    console.error('Search Critical Failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
