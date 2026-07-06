import { NextResponse } from 'next/server';

// Detect a raw ISBN (10 or 13 digits, possibly hyphen/space separated,
// ISBN-10 may end in 'X'). If so, use Google Books' exact isbn: match
// instead of a fuzzy title search — this is what makes scanning reliable.
function toGoogleQuery(raw: string): string {
  const q = raw.trim();
  const compact = q.replace(/[-\s]/g, '');
  const isIsbn13 = /^\d{13}$/.test(compact);
  const isIsbn10 = /^\d{9}[\dXx]$/.test(compact);
  if (isIsbn13 || isIsbn10) return `isbn:${compact}`;
  // Allow the client to pass an explicit "isbn:..." through untouched.
  if (/^isbn:/i.test(q)) return q;
  return q;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // Prefer a server-only key; fall back to the legacy public name so
    // nothing breaks before you migrate the env var in Vercel.
    const googleKey =
      process.env.GOOGLE_BOOKS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    if (!googleKey) {
      console.error('SERVER: Missing Google Books API Key');
      return NextResponse.json({
        results: [
          {
            id: 'error-key',
            title: '⚠️ Configuration Error',
            author: 'Missing Google Books API key on the server',
            coverUrl: null,
            rating: 0,
            popularity: 0,
          },
        ],
      });
    }

    if (!query) return NextResponse.json({ results: [] });

    const googleQuery = toGoogleQuery(query);

    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        googleQuery
      )}&key=${googleKey}&maxResults=20&printType=books`
    );

    if (!res.ok) {
      return NextResponse.json({
        results: [
          {
            id: 'error-google',
            title: `⚠️ Google Error: ${res.status}`,
            author: 'Check quota or key validity',
            coverUrl: null,
            rating: 0,
            popularity: 0,
          },
        ],
      });
    }

    const data = await res.json();
    if (!data.items) return NextResponse.json({ results: [] });

    const results = data.items.map((item: any) => {
      const info = item.volumeInfo || {};
      const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
      // Prefer ISBN-13, fall back to ISBN-10.
      const ids = info.industryIdentifiers || [];
      const isbn =
        ids.find((x: any) => x.type === 'ISBN_13')?.identifier ||
        ids.find((x: any) => x.type === 'ISBN_10')?.identifier ||
        null;
      return {
        id: item.id,
        title: info.title || 'Untitled',
        author: info.authors ? info.authors[0] : 'Unknown',
        coverUrl: img ? img.replace('http:', 'https:') : null,
        isbn,
        popularity: info.ratingsCount || 0,
        rating: info.averageRating || 0,
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({
      results: [
        {
          id: 'error-crash',
          title: '⚠️ Server Crash',
          author: error.message,
          coverUrl: null,
          rating: 0,
          popularity: 0,
        },
      ],
    });
  }
}
