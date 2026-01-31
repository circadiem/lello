import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  console.log(`[API] Searching Google Books for: ${query}`);

  try {
    const googleRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`,
      {
        headers: {
          'User-Agent': 'Lello-App/1.0', // Helps avoid Google bot blocking
        },
        cache: 'no-store', // CRITICAL: Forces fresh data every time
      }
    );

    if (!googleRes.ok) {
      console.error(`[API] Google Error: ${googleRes.status}`);
      return NextResponse.json({ error: 'Google API Error' }, { status: googleRes.status });
    }

    const data = await googleRes.json();
    
    // Transform Data Logic
    const books = (data.items || []).map((item: any) => {
        const info = item.volumeInfo || {};
        const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13') 
                     || info.industryIdentifiers?.[0];
        
        return {
            id: item.id,
            title: info.title || 'Untitled',
            author: info.authors ? info.authors.join(', ') : 'Unknown',
            // Force HTTPS to prevent mixed content errors
            coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            pageCount: info.pageCount || 0,
            isbn: isbnObj?.identifier || 'N/A'
        };
    });

    return NextResponse.json(books);

  } catch (error) {
    console.error('[API] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
