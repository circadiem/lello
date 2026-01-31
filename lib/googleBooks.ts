export interface GoogleBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    pageCount: number;
    isbn?: string;
  }
  
  export const searchBooks = async (query: string): Promise<GoogleBook[]> => {
    if (!query.trim()) return [];
  
    try {
      // maxResults=5 as requested
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch from Google Books');
      }
  
      const data = await res.json();
      
      if (!data.items) return [];
  
      return data.items.map((item: any) => {
        const info = item.volumeInfo;
        
        // Try to find ISBN-13, fall back to ISBN-10 or null
        const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13') 
                     || info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10');
        
        return {
          id: item.id,
          title: info.title || 'Untitled',
          author: info.authors ? info.authors.join(', ') : 'Unknown Author',
          // Ensure HTTPS for images to avoid mixed content warnings
          coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          pageCount: info.pageCount || 0,
          isbn: isbnObj?.identifier || 'N/A'
        };
      });
    } catch (error) {
      console.error("Google Books Search Error:", error);
      return [];
    }
  };
  