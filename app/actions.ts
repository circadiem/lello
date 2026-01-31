'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// --- 1. SEARCH ACTION (With Safety Fallback) ---
export async function searchGoogleBooks(query: string) {
  if (!query) return [];

  console.log(`Server Action: Searching for "${query}"`);

  // Helper to fetch from Google
  const fetchBooks = async (useKey: boolean) => {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`;
    if (useKey && process.env.GOOGLE_API_KEY) {
      url += `&key=${process.env.GOOGLE_API_KEY}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return res.json();
  };

  try {
    let data;
    
    // Attempt 1: Try with Key
    try {
      data = await fetchBooks(true);
    } catch (e) {
      // Attempt 2: Try Public
      data = await fetchBooks(false);
    }

    // --- SAFETY NET: If Google blocks us, return Mock Data so you can test the app ---
    if (!data.items || data.items.length === 0) {
      console.log("Google API returned 0 results. Returning DEMO DATA for testing.");
      return [
        {
          id: 'demo_1',
          title: 'Harry Potter and the Sorcerer\'s Stone',
          author: 'J.K. Rowling',
          coverUrl: 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE72G3gA5A-Ka8XjOZGDFLAoUe2Bb0Q9y-MWDbuhP6Q3f-2b5wW5x9l9E-2b5wW5x9l9E&source=gbs_api',
          pageCount: 309,
          isbn: '9780590353427'
        },
        {
          id: 'demo_2',
          title: 'The Very Hungry Caterpillar',
          author: 'Eric Carle',
          coverUrl: 'https://books.google.com/books/content?id=7cdCAgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
          pageCount: 26,
          isbn: '9780399226908'
        }
      ];
    }

    // Normal Success Path
    return data.items.map((item: any) => {
      const info = item.volumeInfo;
      const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13') 
                   || info.industryIdentifiers?.[0];

      return {
        id: item.id,
        title: info.title || 'Untitled',
        author: info.authors ? info.authors.join(', ') : 'Unknown',
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        pageCount: info.pageCount || 0,
        isbn: isbnObj?.identifier || 'N/A'
      };
    });

  } catch (error) {
    console.error("Search Action Failed:", error);
    // Return empty to prevent crash
    return [];
  }
}

// --- 2. AI ANALYST ACTION ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function generateAnalystNote(title: string, author: string) {
  if (!process.env.GOOGLE_API_KEY) return "Analyst coverage unavailable (API Key missing).";

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
      Act as a "Literary Asset Analyst" for a family reading app. 
      Write a short, 2-sentence "Investment Thesis" for the children's book "${title}" by ${author}. 
      Explain the educational ROI (vocabulary, empathy, etc) in professional but warm language.
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Market analysis temporarily unavailable.";
  }
}
