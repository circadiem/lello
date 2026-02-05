'use client';

import React, { useState, useEffect, use } from 'react'; // Added 'use' import
import { supabase } from '@/lib/supabaseClient';
import { Gift, Check, ExternalLink, BookOpen, User, ShoppingBag } from 'lucide-react';

// FIX: Params is now a Promise in Next.js 15
export default function RegistryPage({ params }: { params: Promise<{ userId: string }> }) {
  // FIX: Unwrap the params using React.use()
  const { userId } = use(params);

  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [giverName, setGiverName] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (userId) {
        fetchRegistry(userId);
    }
  }, [userId]);

  const fetchRegistry = async (id: string) => {
    // 1. Get Profile Name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('readers')
      .eq('id', id)
      .single();
    
    setProfile(profileData);

    // 2. Get Wishlist Books (that haven't been bought yet)
    const { data: bookData } = await supabase
      .from('library')
      .select('*')
      .eq('user_id', id)
      .eq('ownership_status', 'wishlist')
      .is('purchased_at', null) 
      .order('created_at', { ascending: false });

    if (bookData) setBooks(bookData);
    setLoading(false);
  };

  const handleIntercept = (book: any) => {
    setSelectedBook(book);
    setGiverName(''); 
  };

  const executePurchase = async () => {
    if (!selectedBook) return;
    setClaiming(true);

    // 1. Mark as Purchased in DB
    await supabase
      .from('library')
      .update({ 
        purchased_by: giverName || 'A Family Friend',
        purchased_at: new Date().toISOString()
      })
      .eq('id', selectedBook.id);

    // 2. Update UI locally (remove from list)
    setBooks(prev => prev.filter(b => b.id !== selectedBook.id));

    // 3. Redirect to Amazon Search
    const query = `${selectedBook.title} ${selectedBook.author}`;
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=stripbooks`;
    
    window.open(url, '_blank');
    
    setClaiming(false);
    setSelectedBook(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-12 h-12 bg-slate-200 rounded-full"></div><div className="h-4 w-32 bg-slate-200 rounded"></div></div></div>;

  const displayName = profile?.readers 
    ? profile.readers.filter((r: string) => r !== 'Parents').join(' & ') 
    : 'Child';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-6 py-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                <Gift size={24} />
            </div>
            <div>
                <h1 className="text-xl font-extrabold tracking-tight leading-tight">{displayName}'s Library</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wishlist Registry</p>
            </div>
        </div>
      </div>

      {/* List */}
      <main className="max-w-md mx-auto px-6 py-8 space-y-4">
        {books.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Check size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">All Caught Up!</h3>
                <p className="text-sm text-slate-500">Every book on the list has been purchased. Amazing!</p>
            </div>
        ) : (
            books.map(book => (
                <div key={book.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex gap-5">
                        <div className="w-20 h-28 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center text-slate-300 overflow-hidden border border-slate-50 relative">
                            {book.cover_url ? (
                                <img src={book.cover_url} className="w-full h-full object-cover" />
                            ) : (
                                <BookOpen size={24} />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1 line-clamp-2">{book.title}</h3>
                            <p className="text-sm font-medium text-slate-500 mb-3">{book.author}</p>
                            
                            {book.shelves && book.shelves.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {book.shelves.slice(0, 2).map((tag: string) => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleIntercept(book)}
                        className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-slate-800"
                    >
                        <ShoppingBag size={18} />
                        <span>Buy This Book</span>
                    </button>
                </div>
            ))
        )}
      </main>

      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBook(null)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Gift size={28} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Great Choice!</h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        We'll send you to Amazon to buy <strong>{selectedBook.title}</strong>. 
                        We'll mark it as "Purchased" here so no one else buys it.
                    </p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">From (Optional)</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="e.g. Nana & Papa"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                value={giverName}
                                onChange={(e) => setGiverName(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        disabled={claiming}
                        onClick={executePurchase}
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-70 disabled:pointer-events-none mt-2"
                    >
                        {claiming ? 'Processing...' : 'Confirm & Go to Amazon'}
                        {!claiming && <ExternalLink size={18} />}
                    </button>
                    
                    <button 
                        onClick={() => setSelectedBook(null)}
                        className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
