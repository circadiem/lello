'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ScanBarcode, Plus, Book, Loader2, ImageOff, AlertCircle, CheckCircle2, UserCircle2 } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

// --- Types ---
export interface GoogleBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pageCount: number;
  isbn?: string;
}

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: GoogleBook, selectedReaders: string[]) => void;
  readers: string[];
  activeReader: string;
}

// --- CLIENT SIDE SEARCH (Moved Outside Component for Stability) ---
const performSearch = async (query: string): Promise<GoogleBook[]> => {
  console.log("Executing Search:", query);
  
  if (query.toLowerCase() === 'test') {
    return [{
      id: 'test-1', title: 'Test Book: Harry Potter', author: 'J.K. Rowling',
      coverUrl: 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      pageCount: 300, isbn: '123456789'
    }];
  }

  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
    const data = await res.json();
    
    if (!data.items) {
      if (query.startsWith('isbn:')) {
         return performSearch(query.replace('isbn:', ''));
      }
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || 'Untitled',
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown',
      coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      pageCount: item.volumeInfo.pageCount || 0,
      isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier || 'N/A'
    }));

  } catch (err) {
    console.error("Search API Error", err);
    // Fallback data if API fails
    return [{
      id: 'fallback-1', title: 'Harry Potter (Fallback)', author: 'J.K. Rowling',
      coverUrl: 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      pageCount: 300, isbn: '9780590353427'
    }];
  }
};

export default function AddBookModal({ isOpen, onClose, onAdd, readers = [], activeReader }: AddBookModalProps) {
  const [mode, setMode] = useState<'scan' | 'search'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Multi-Select State
  const [selectedReaders, setSelectedReaders] = useState<string[]>([activeReader]);

  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Reset logic
  useEffect(() => {
    if (isOpen && activeReader) {
        setSelectedReaders([activeReader]);
    }
  }, [isOpen, activeReader]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const toggleReader = (reader: string) => {
    setSelectedReaders(prev => 
      prev.includes(reader) 
        ? prev.filter(r => r !== reader) 
        : [...prev, reader]
    );
  };

  // --- SCANNER LOGIC ---
  useEffect(() => {
    if (mode === 'scan' && isOpen) {
      const timer = setTimeout(async () => {
        if (scannerRef.current || isScanningRef.current) return;

        try {
          const html5QrCode = new Html5Qrcode("reader", false);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" }, 
            {
              fps: 10,
              qrbox: { width: 300, height: 150 },
              aspectRatio: 1.0,
              formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.UPC_A,
              ]
            },
            async (decodedText) => {
              // Pause scanning
              if (isScanningRef.current) {
                 isScanningRef.current = false;
                 html5QrCode.pause(true); 
              }

              setIsProcessingScan(true);
              const books = await performSearch(`isbn:${decodedText}`);
              
              if (books && books.length > 0) {
                  await html5QrCode.stop();
                  html5QrCode.clear();
                  scannerRef.current = null;
                  
                  // SUCCESS: Switch to Search Mode to show the book & allow reader selection
                  setMode('search');
                  setResults([books[0]]); 
                  setIsProcessingScan(false);
              } else {
                  setScannerError(`Book not found: ${decodedText}`);
                  setIsProcessingScan(false);
                  setTimeout(() => {
                      html5QrCode.resume();
                      isScanningRef.current = true;
                      setScannerError(null);
                  }, 2000);
              }
            },
            (errorMessage) => { /* ignore frames */ }
          );
          isScanningRef.current = true;
          setScannerError(null);
          setIsProcessingScan(false);

        } catch (err) {
            setScannerError("Camera access failed.");
            isScanningRef.current = false;
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && isScanningRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
                scannerRef.current = null;
                isScanningRef.current = false;
            }).catch(console.error);
        }
      };
    }
  }, [mode, isOpen]);

  // --- MANUAL SEARCH LOGIC ---
  useEffect(() => {
    if (mode === 'scan') return; 

    const delayDebounceFn = setTimeout(async () => {
      const trimmedQuery = searchQuery.trim();
      
      if (trimmedQuery.length > 2) {
        setIsSearching(true);
        const books = await performSearch(trimmedQuery);
        setResults(books);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, mode]);

  const handleSelectBook = (book: GoogleBook) => {
      onAdd(book, selectedReaders);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-start bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 py-6 shrink-0">
        <div className="flex bg-slate-800/50 p-1 rounded-full border border-slate-700">
          <button 
            onClick={() => { setMode('scan'); setSearchQuery(''); setIsProcessingScan(false); setScannerError(null); }}
            className={`px-5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${
              mode === 'scan' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'
            }`}
          >
            <ScanBarcode size={14} />
            Scan
          </button>
          <button 
            onClick={() => setMode('search')}
            className={`px-5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${
              mode === 'search' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'
            }`}
          >
            <Search size={14} />
            Search
          </button>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-all">
          <X size={24} />
        </button>
      </div>

      {/* Main View */}
      <div className="flex-1 w-full max-w-lg px-6 flex flex-col items-center justify-start pt-4 overflow-hidden">
        
        {/* READER SELECTOR (Visible in Search Mode) */}
        {mode === 'search' && (
            <div className="w-full mb-4 animate-in slide-in-from-top-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Reading For</p>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {readers.map(reader => (
                        <button
                            key={reader}
                            onClick={() => toggleReader(reader)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
                                selectedReaders.includes(reader)
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            <UserCircle2 size={14} strokeWidth={2.5} />
                            <span className="text-xs font-bold">{reader}</span>
                            {selectedReaders.includes(reader) && <CheckCircle2 size={14} className="ml-1" />}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {mode === 'scan' ? (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500 mt-4">
             <div className="w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-2 border-slate-700 relative shadow-2xl">
                {isProcessingScan ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-30 animate-in fade-in">
                        <CheckCircle2 size={48} className="text-emerald-500 mb-4 animate-bounce" />
                        <p className="text-white font-bold text-lg">Processing...</p>
                        <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Fetching data...</span>
                        </div>
                    </div>
                ) : scannerError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center z-20">
                        <AlertCircle size={32} className="mb-2 text-red-400" />
                        <p className="text-sm">{scannerError}</p>
                        <div className="flex gap-2 mt-4">
                            <button 
                                onClick={() => { setScannerError(null); scannerRef.current?.resume(); isScanningRef.current = true; }}
                                className="px-4 py-2 bg-slate-800 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-700"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={() => setMode('search')}
                                className="px-4 py-2 bg-slate-700 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-600"
                            >
                                Manual Search
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                      <div id="reader" className="w-full h-full relative z-10" />
                      <div className="absolute top-1/2 left-[5%] right-[5%] h-[2px] bg-red-500 z-20 shadow-[0_0_10px_rgba(239,68,68,0.8)] opacity-80" />
                    </>
                )}
             </div>
             {!isProcessingScan && !scannerError && (
                 <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Scan Barcode</p>
             )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-safe">
            <div className="relative shrink-0">
              <input 
                autoFocus
                type="text"
                placeholder="Search Title or ISBN..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-3xl py-5 px-6 pl-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <Loader2 className="animate-spin text-emerald-500" size={20} />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar w-full pb-20">
              {results.length > 0 ? (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 sticky top-0 bg-slate-900/95 backdrop-blur-xl py-2 z-10">Results</p>
                    {results.map((book) => (
                    <button
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        className="w-full bg-slate-800/30 hover:bg-slate-800/60 p-4 rounded-[2rem] border border-slate-700/50 flex items-center justify-between group active:scale-[0.98] transition-all text-left"
                    >
                        <div className="flex items-center gap-4 w-full overflow-hidden">
                        <div className="w-12 h-16 shrink-0 bg-slate-700 rounded-xl overflow-hidden flex items-center justify-center text-slate-400 border border-slate-600 relative">
                            {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : <ImageOff size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold leading-tight truncate pr-2">{book.title}</p>
                            <p className="text-slate-500 text-xs font-medium truncate">{book.author}</p>
                        </div>
                        </div>
                        <div className="pl-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedReaders.length === 0 ? 'bg-slate-700 text-slate-500' : 'bg-white text-slate-900'}`}>
                                <Plus size={20} strokeWidth={3} />
                            </div>
                        </div>
                    </button>
                    ))}
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center h-40 opacity-30">
                  <Search size={48} className="text-slate-600 mb-2" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {isSearching ? "Searching..." : "Type 'Test' or Scan"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; } 
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        #reader video { object-fit: cover; border-radius: 1.5rem; width: 100% !important; height: 100% !important; }
      `}} />
    </div>
  );
}
