'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Loader2, AlertCircle, Check, Plus } from 'lucide-react';

export interface GoogleBook {
  title: string;
  author: string;
  coverUrl: string | null;
  description: string;
  pageCount: number;
}

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: GoogleBook, readers: string[]) => void;
  readers: string[];
  activeReader: string;
}

export default function AddBookModal({ isOpen, onClose, onAdd, readers, activeReader }: AddBookModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [selectedReaders, setSelectedReaders] = useState<string[]>([activeReader]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setQuery('');
        setResults([]);
        setError(null);
        setSelectedBook(null);
        setSelectedReaders([activeReader]);
    }
  }, [isOpen, activeReader]);

  const searchBooks = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
        setError("Missing API Key. Check Vercel Environment Variables.");
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=10`);
      
      if (!response.ok) {
          throw new Error(`Google API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items) {
        const formatted = data.items.map((item: any) => ({
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Unknown Author',
          coverUrl: item.volumeInfo.imageLinks?.thumbnail || null,
          description: item.volumeInfo.description || '',
          pageCount: item.volumeInfo.pageCount || 0
        }));
        setResults(formatted);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to search books.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchBooks();
  };

  const toggleReader = (reader: string) => {
    setSelectedReaders(prev => 
      prev.includes(reader) ? prev.filter(r => r !== reader) : [...prev, reader]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-[90vh] sm:h-auto bg-slate-50 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add Asset</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-white space-y-4 shadow-sm z-10">
           <div className="flex gap-2">
             <div className="relative flex-1">
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Search title, author, ISBN..." 
                 className="w-full bg-slate-100 border-0 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 transition-all"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             </div>
             <button onClick={searchBooks} disabled={loading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-70">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
             </button>
           </div>
           
           {/* Readers Toggle */}
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {readers.map(r => (
               <button 
                 key={r} 
                 onClick={() => toggleReader(r)}
                 className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedReaders.includes(r) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
               >
                 {r}
               </button>
             ))}
           </div>

           {/* ERROR MESSAGE */}
           {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                   <AlertCircle size={18} />
                   <span>{error}</span>
               </div>
           )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]">
           {results.map((book, i) => (
             <button 
               key={i} 
               onClick={() => setSelectedBook(book)}
               className={`w-full p-3 rounded-[1.5rem] border flex items-center gap-4 text-left transition-all ${selectedBook === book ? 'bg-emerald-50 border-emerald-500 shadow-md scale-[1.02]' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'}`}
             >
               <div className="w-12 h-16 shrink-0 bg-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-slate-400">
                  {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 line-clamp-1">{book.title}</p>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{book.author}</p>
               </div>
               {selectedBook === book && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
             </button>
           ))}
           {results.length === 0 && !loading && !error && (
             <div className="text-center py-10 text-slate-400 text-sm font-bold opacity-60">Search above to find assets</div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100">
          <button 
            disabled={!selectedBook}
            onClick={() => selectedBook && onAdd(selectedBook, selectedReaders)}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
             <Plus size={20} strokeWidth={3} />
             Add to Library
          </button>
        </div>
      </div>
    </div>
  );
}
