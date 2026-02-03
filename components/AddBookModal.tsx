'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Loader2, AlertCircle, Check, Plus, Gift, CalendarCheck, MessageSquare } from 'lucide-react';

export interface GoogleBook {
  id: string; 
  title: string;
  author: string;
  coverUrl: string | null;
  description: string;
  pageCount: number;
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
  
  // Selection State
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [selectedReaders, setSelectedReaders] = useState<string[]>([activeReader]);
  const [logSession, setLogSession] = useState(true);
  const [note, setNote] = useState('');

  // DEBUG: Check API Key immediately
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

  useEffect(() => {
    if (isOpen) {
        setQuery(initialQuery);
        if (initialQuery) searchBooks(initialQuery);
        else {
            setResults([]);
            setSelectedBook(null);
        }
        setError(null);
        setLogSession(true);
        setNote('');
        
        // Reset readers
        if (activeReader && activeReader !== 'Parents') setSelectedReaders([activeReader]);
        else if (readers.length > 0) setSelectedReaders([readers[0]]);
    }
  }, [isOpen, activeReader, readers, initialQuery]);

  // Debounce
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

    if (!apiKey) {
        setError("CRITICAL: Missing API Key in Vercel Env Vars.");
        setLoading(false);
        return;
    }

    try {
      // Direct Fetch - No fancy logic, just get data
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&key=${apiKey}&maxResults=20&printType=books`;
      const response = await fetch(url);
      
      if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(`Google Error (${response.status}): ${errMsg}`);
      }

      const data = await response.json();
      
      if (data.items) {
        // Simple mapping
        const formatted: GoogleBook[] = data.items
            .filter((item: any) => item.volumeInfo.title) // Ensure title exists
            .map((item: any) => ({
                id: item.id,
                title: item.volumeInfo.title,
                author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Unknown',
                coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
                description: '',
                pageCount: item.volumeInfo.pageCount || 0
            }));
        
        // Simple Sort: Cover first
        formatted.sort((a, b) => (b.coverUrl ? 1 : 0) - (a.coverUrl ? 1 : 0));
        
        if (formatted.length > 0) setSelectedBook(formatted[0]);
        setResults(formatted);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error("Search Error:", err);
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleReader = (reader: string) => {
    setSelectedReaders(prev => prev.includes(reader) ? prev.filter(r => r !== reader) : [...prev, reader]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg h-[90vh] sm:h-auto bg-slate-50 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-extrabold text-slate-900">Add Book</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20} /></button>
        </div>

        {/* Search */}
        <div className="p-6 bg-white space-y-4 shadow-sm z-10">
           <div className="flex gap-2">
             <div className="relative flex-1">
               <input 
                 autoFocus={!initialQuery} 
                 type="text" 
                 placeholder="Search title, author, or ISBN..." 
                 className="w-full bg-slate-100 border-0 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && searchBooks(query)}
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             </div>
             <button onClick={() => searchBooks(query)} disabled={loading} className="bg-slate-900 text-white p-4 rounded-2xl">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
             </button>
           </div>
           
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {readers.map(r => (
               <button key={r} onClick={() => toggleReader(r)} className={`px-4 py-2 rounded-full text-xs font-bold border ${selectedReaders.includes(r) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>{r}</button>
             ))}
           </div>

           {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                   <AlertCircle size={18} />
                   <span>{error}</span>
               </div>
           )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[200px]">
           {results.map((book, i) => (
             <button key={i} onClick={() => setSelectedBook(book)} className={`w-full p-3 rounded-[1.5rem] border flex items-center gap-4 text-left transition-all ${selectedBook?.title === book.title ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-100 shadow-sm'}`}>
               <div className="w-12 h-16 shrink-0 bg-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-slate-400">
                  {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 line-clamp-1">{book.title}</p>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{book.author}</p>
               </div>
               {selectedBook?.title === book.title && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>}
             </button>
           ))}
           {results.length === 0 && !loading && !error && <div className="text-center py-10 text-slate-400 text-sm font-bold opacity-60">No results found</div>}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 space-y-4">
          {selectedBook && (
              <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${logSession ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {logSession && <Check size={14} strokeWidth={4} />}
                      </div>
                      <input type="checkbox" className="hidden" checked={logSession} onChange={() => setLogSession(!logSession)} />
                      <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">Log reading session?</p>
                      </div>
                      <CalendarCheck size={18} className="text-slate-400" />
                  </label>
                  {logSession && (
                      <div className="relative">
                          <MessageSquare size={16} className="absolute left-4 top-4 text-slate-400" />
                          <textarea placeholder="Optional: What did they think?" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none h-20" value={note} onChange={(e) => setNote(e.target.value)} />
                      </div>
                  )}
              </div>
          )}
          <div className="flex gap-3">
            <button disabled={!selectedBook} onClick={() => selectedBook && onAdd(selectedBook, selectedReaders, 'owned', logSession, note)} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
                <Plus size={20} strokeWidth={3} /> {logSession ? 'Add & Log' : 'Add to Shelf'}
            </button>
            <button disabled={!selectedBook} onClick={() => selectedBook && onAdd(selectedBook, [], 'wishlist', false, '')} className="flex-1 py-4 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">
                <Gift size={20} strokeWidth={2.5} /> Registry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
