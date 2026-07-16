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

// Google Books throws transient 503s (often when it can't geo-locate a
// serverless caller). Retry a few times with backoff before giving up.
// Config problems (400/403 — bad key / quota) fail fast so they surface.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 3,
  delays = [300, 800, 1500]
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (!RETRYABLE_STATUSES.has(res.status)) return res;
    lastResponse = res;
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, delays[attempt] ?? 1500));
    }
  }
  return lastResponse!;
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
      return NextResponse.json(
        { error: 'google_books_misconfigured' },
        { status: 500 }
      );
    }

    if (!query) return NextResponse.json({ results: [] });

    const googleQuery = toGoogleQuery(query);

    const res = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        googleQuery
      )}&country=US&key=${googleKey}&maxResults=20&printType=books`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'google_books_unavailable', status: res.status },
        { status: 502 }
      );
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
    console.error('SERVER: Book search crashed', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
