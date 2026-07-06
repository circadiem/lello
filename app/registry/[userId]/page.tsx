'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Gift, Check, ExternalLink, BookOpen, User, ShoppingBag } from 'lucide-react';

// Optional Amazon Associates tag. Set NEXT_PUBLIC_AMAZON_AFFILIATE_TAG in
// .env.local / Vercel once your account is approved; links work fine without it.
const AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || '';

export default function RegistryPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);

  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [giverName, setGiverName] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [occasionFilter, setOccasionFilter] = useState<string>('all');
  // Set when the claim succeeded but the browser blocked the auto-opened
  // tab — we then show a success view with a real tappable link instead.
  const [claimedUrl, setClaimedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userId) fetchRegistry(userId);
  }, [userId]);

  const fetchRegistry = async (id: string) => {
    const { data, error } = await supabase.rpc('get_registry', {
      registry_user_id: id,
    });

    if (error) {
      console.error('Registry load error:', error);
      setLoading(false);
      return;
    }

    setProfile({ readers: data?.readers ?? [] });
    setBooks(data?.books ?? []);
    setLoading(false);
  };

  // Occasion chips, derived from whatever labels the parent actually used.
  const occasions = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => b.occasion && set.add(b.occasion));
    return Array.from(set);
  }, [books]);

  const visibleBooks = useMemo(
    () => (occasionFilter === 'all' ? books : books.filter(b => b.occasion === occasionFilter)),
    [books, occasionFilter]
  );

  // Convert ISBN-13 (978-prefixed) to ISBN-10. For books, Amazon's /dp/
  // product ID IS the ISBN-10, which gives a direct product-page link.
  const isbn13to10 = (isbn13: string): string | null => {
    const d = isbn13.replace(/[^0-9]/g, '');
    if (d.length !== 13 || !d.startsWith('978')) return null; // 979 has no ISBN-10
    const core = d.slice(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(core[i], 10) * (10 - i);
    const check = (11 - (sum % 11)) % 11;
    return core + (check === 10 ? 'X' : String(check));
  };

  const withTag = (url: string): string => {
    if (!AFFILIATE_TAG) return url;
    return url + (url.includes('?') ? '&' : '?') + `tag=${encodeURIComponent(AFFILIATE_TAG)}`;
  };

  const amazonUrlFor = (book: any): string => {
    const isbn = (book.isbn || '').replace(/[^0-9Xx]/g, '');
    if (isbn) {
      const isbn10 = isbn.length === 13 ? isbn13to10(isbn) : isbn.length === 10 ? isbn : null;
      if (isbn10) return withTag(`https://www.amazon.com/dp/${isbn10}`); // exact edition
      return withTag(`https://www.amazon.com/s?k=${encodeURIComponent(isbn)}&i=stripbooks`);
    }
    const query = `${book.title} ${book.author ?? ''}`.trim();
    return withTag(`https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=stripbooks`);
  };

  const handleIntercept = (book: any) => {
    setSelectedBook(book);
    setGiverName('');
    setClaimedUrl(null);
  };

  const closeModal = () => {
    setSelectedBook(null);
    setClaimedUrl(null);
  };

  const executePurchase = async () => {
    if (!selectedBook || claiming) return;
    setClaiming(true);

    // Open the tab NOW, synchronously inside the tap gesture, so popup
    // blockers (especially iOS Safari) allow it. We point it at Amazon only
    // after the claim succeeds; on failure we close it again. Opening after
    // an `await` is what silently broke the redirect before.
    const win = window.open('', '_blank');
    const url = amazonUrlFor(selectedBook);

    const { data: claimed, error } = await supabase.rpc('claim_gift', {
      book_id: selectedBook.id,
      giver: giverName,
    });

    if (error) {
      console.error('Claim error:', error);
      win?.close();
      alert('Something went wrong claiming this gift. Please try again.');
      setClaiming(false);
      return;
    }

    if (claimed === false) {
      // Someone else grabbed it first — refresh so the list is honest.
      win?.close();
      alert('Looks like someone just claimed this one! Refreshing the list.');
      closeModal();
      setClaiming(false);
      fetchRegistry(userId);
      return;
    }

    // Success: remove locally, then send the giver to Amazon.
    setBooks(prev => prev.filter(b => b.id !== selectedBook.id));
    setClaiming(false);

    if (win) {
      win.location.href = url;
      closeModal();
    } else {
      // The browser blocked even the synchronous open — show a success view
      // with a real link. A direct anchor tap is never popup-blocked.
      setClaimedUrl(url);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );

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
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">
              {displayName}'s Library
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Wish List
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 py-8 space-y-4">
        {/* Occasion chips — only shown if the parent labeled any books */}
        {occasions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {['all', ...occasions].map(o => (
              <button
                key={o}
                onClick={() => setOccasionFilter(o)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  occasionFilter === o
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {o === 'all' ? 'All' : o}
              </button>
            ))}
          </div>
        )}

        {visibleBooks.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Check size={32} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-sm text-slate-500">
              {occasionFilter === 'all'
                ? 'Every book on the list has been purchased. Amazing!'
                : 'No books left for this occasion — try another tab.'}
            </p>
          </div>
        ) : (
          visibleBooks.map(book => (
            <div
              key={book.id}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4"
            >
              <div className="flex gap-5">
                <div className="w-20 h-28 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center text-slate-300 overflow-hidden border border-slate-50 relative">
                  {book.cover_url ? (
                    <img src={book.cover_url} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={24} />
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-2">{book.author}</p>
                  {book.occasion && (
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                      {book.occasion}
                    </span>
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
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            {claimedUrl ? (
              /* Success view — shown only if the browser blocked the auto-open */
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check size={28} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Marked as Purchased!</h2>
                <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                  <strong>{selectedBook.title}</strong> is reserved for you. Tap below to buy it on
                  Amazon.
                </p>
                <a
                  href={claimedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-emerald-600"
                >
                  Continue to Amazon <ExternalLink size={18} />
                </a>
                <button
                  onClick={closeModal}
                  className="w-full py-3 mt-1 text-slate-400 font-bold text-xs hover:text-slate-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Gift size={28} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">Great Choice!</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    We'll send you to Amazon to buy <strong>{selectedBook.title}</strong>. We'll
                    mark it as "Purchased" here so no one else buys it.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                      From (Optional)
                    </label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="e.g. Nana & Papa"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        value={giverName}
                        onChange={e => setGiverName(e.target.value)}
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
                    onClick={closeModal}
                    className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
