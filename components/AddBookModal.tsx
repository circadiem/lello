'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Loader2, AlertCircle, Check, Plus, Gift, CalendarCheck, MessageSquare, ChevronDown, Star } from 'lucide-react';

export interface GoogleBook {
  id: string; 
  title: string;
  author: string;
  coverUrl: string | null;
  description?: string;
  pageCount?: number;
  source?: 'community' | 'google';
  popularity?: number; 
  rating?: number;     
}

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: GoogleBook, readers: string[], status: 'owned' | 'wishlist', shouldLog: boolean, note: string) => void;
  readers: string[];
  activeReader: string;
  initialQuery?: string;
}

export default function AddBookModal({ isOpen, onClose, onAdd, readers, activeReader, initialQuery = '' }: AddBookModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [selectedReaders, setSelectedReaders] = useState<string[]>([activeReader]);
  const [logSession, setLogSession] = useState(true);
  const [note, setNote] = useState('');
  const [showAllResults, setShowAllResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setQuery(initialQuery);
        if (initialQuery) {
            searchBooks(initialQuery);
        } else {
            setResults([]);
            setSelectedBook(null);
        }
        
        setError(null);
        setLogSession(true);
        setNote('');
        setShowAllResults(false);
        if (activeReader && activeReader !== 'Parents') {
            setSelectedReaders([activeReader]);
        } else if (readers.length > 0) {
            setSelectedReaders([readers[0]]);
        }
    }
  }, [isOpen, activeReader, readers, initialQuery]);

  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
        if (query && query.length >= 3 && query !== initialQuery) {
          searchBooks(query);
        }
      }, 800); 

      return () => clearTimeout(delayDebounceFn);
  }, [query, initialQuery]);

  const searchBooks = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setShowAllResults(false); 

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchTerm })
        });

        // Safe Response Handling
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
             throw new Error(`Server Error: ${response.status}`);
        }
        
        // If the server returns HTML (error page) instead of JSON, fail gracefully
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("API returned non-JSON:", text);
            throw new Error("Search service unavailable (Invalid Response).");
        }

        const data = await response.json();

        if (data.error) throw new Error(data.error);
        
        const books = data.results || [];
        
        if (books.length > 0) {
            setSelectedBook(books[0]);
            setResults(books);
        } else {
            setResults([]);
            setSelectedBook(null);
        }

    } catch (err: any) {
      console.error("Search Fetch Error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchBooks(query);
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
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add Book</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Area */}
        <div className="p-6 bg-white space-y-4 shadow-sm z-10">
           <div className="flex gap-2">
             <div className="relative flex-1">
               <input 
                 autoFocus={!initialQuery} 
                 type="text" 
                 placeholder="Search title, author, or ISBN..." 
                 className="w-full bg-slate-100 border-0 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 transition-all"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             </div>
             <button onClick={() => searchBooks(query)} disabled={loading} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-70">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
             </button>
           </div>
           
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

           {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                   <AlertCircle size={18} />
                   <span>{error}</span>
               </div>
           )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[200px]">
           
           {/* 1. Best Match View */}
           {!showAllResults && results.length > 0 && (
               <div className="animate-in fade-in zoom-in-95 duration-300">
                   <div className="flex items-center gap-2 mb-3 pl-2">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Match</p>
                       {(results[0].popularity || 0) > 100 ? (
                           <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm border border-amber-200">
                               <Star size={10} fill="currentColor" /> Popular
                           </span>
                       ) : null}
                   </div>
                   
                   <button 
                        onClick={() => setSelectedBook(results[0])}
                        className="w-full p-4 rounded-[2rem] bg-white border-2 border-emerald-500 shadow-xl flex gap-5 text-left items-start relative overflow-hidden transition-transform active:scale-[0.98]"
                   >
                       <div className="w-24 h-36 shrink-0 bg-slate-200 rounded-xl overflow-hidden shadow-md flex items-center justify-center text-slate-400">
                          {results[0].coverUrl ? <img src={results[0].coverUrl} className="w-full h-full object-cover" /> : <BookOpen size={32} />}
                       </div>
                       <div className="flex-1 min-w-0 py-2">
                          <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-1 line-clamp-2">{results[0].title}</h3>
                          <p className="text-sm font-medium text-slate-500 mb-4">{results[0].author}</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                              <Check size={14} strokeWidth={3} />
                              Selected
                          </div>
                       </div>
                   </button>

                   {results.length > 1 && (
                       <button 
                            onClick={() => setShowAllResults(true)}
                            className="w-full mt-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center justify-center gap-2 transition-colors"
                       >
                           <span>Not the right book? See {results.length - 1} more</span>
                           <ChevronDown size={16} />
                       </button>
                   )}
               </div>
           )}

           {/* 2. List View (Expanded) */}
           {showAllResults && results.map((book, i) => (
             <button 
               key={i} 
               onClick={() => setSelectedBook(book)}
               className={`w-full p-3 rounded-[1.5rem] border flex items-center gap-4 text-left transition-all ${selectedBook?.title === book.title ? 'bg-emerald-50 border-emerald-500 shadow-md scale-[1.01]' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'}`}
             >
               <div className="w-12 h-16 shrink-0 bg-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-slate-400">
                  {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 line-clamp-1">{book.title}</p>
                    {(book.popularity || 0) > 500 && <Star size={10} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{book.author}</p>
               </div>
               {selectedBook?.title === book.title && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
             </button>
           ))}

           {results.length === 0 && !loading && !error && (
             <div className="text-center py-10 text-slate-400 text-sm font-bold opacity-60">Search above to find assets</div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-4">
          
          {selectedBook && (
              <div className="space-y-3 animate-in slide-in-from-bottom-2">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${logSession ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {logSession && <Check size={14} strokeWidth={4} />}
                      </div>
                      <input type="checkbox" className="hidden" checked={logSession} onChange={() => setLogSession(!logSession)} />
                      <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">Log reading session?</p>
                          <p className="text-[10px] text-slate-500 font-medium">Uncheck to simply catalog without reading</p>
                      </div>
                      <CalendarCheck size={18} className="text-slate-400" />
                  </label>

                  {logSession && (
                      <div className="relative">
                          <MessageSquare size={16} className="absolute left-4 top-4 text-slate-400" />
                          <textarea 
                              placeholder="Optional: What did they think?"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none h-20"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                          />
                      </div>
                  )}
              </div>
          )}

          <div className="flex gap-3">
            <button 
                disabled={!selectedBook}
                onClick={() => selectedBook && onAdd(selectedBook, selectedReaders, 'owned', logSession, note)}
                className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
                <Plus size={20} strokeWidth={3} />
                {logSession ? 'Add & Log' : 'Add to Library'}
            </button>

            <button 
                disabled={!selectedBook}
                onClick={() => selectedBook && onAdd(selectedBook, [], 'wishlist', false, '')} 
                className="flex-1 py-4 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 font-bold rounded-2xl hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
                <Gift size={20} strokeWidth={2.5} />
                Registry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
