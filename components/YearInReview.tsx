'use client';

import React, { useMemo, useState } from 'react';
import { X, Share2, Check, BookOpen, Flame, Star, CalendarDays } from 'lucide-react';

// Self-contained "Year in Books" recap. Pass in the raw logs + library and
// the reader to celebrate; everything is computed here.
//
// Wiring (in app/page.tsx):
//   const [showYearReview, setShowYearReview] = useState(false);
//   ...
//   {showYearReview && (
//     <YearInReview
//       logs={logs}
//       library={library}
//       readerName={activeReader}
//       onClose={() => setShowYearReview(false)}
//     />
//   )}

interface YearInReviewProps {
  logs: any[]; // ReadingLog[]
  library: any[]; // Book[]
  readerName: string;
  year?: number; // defaults to current year
  onClose: () => void;
}

export default function YearInReview({ logs, library, readerName, year, onClose }: YearInReviewProps) {
  const y = year ?? new Date().getFullYear();
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    // Completed reads by this reader within the year.
    const reads = logs.filter(l => {
      if (l.reader_name !== readerName || !l.timestamp) return false;
      return new Date(l.timestamp).getFullYear() === y;
    });

    const totalReads = reads.reduce((sum, l) => sum + (l.count || 1), 0);

    // Per-title tallies.
    const tally: Record<string, number> = {};
    reads.forEach(l => {
      tally[l.book_title] = (tally[l.book_title] || 0) + (l.count || 1);
    });
    const uniqueTitles = Object.keys(tally).length;

    const topEntry = Object.entries(tally).sort(([, a], [, b]) => b - a)[0] || null;
    const topBook = topEntry
      ? {
          title: topEntry[0],
          count: topEntry[1],
          cover: library.find(b => b.title === topEntry[0])?.cover_url || null,
        }
      : null;

    // Favorite: the highest-rated library book they actually read this year
    // (ties broken by read count).
    const favorite = Object.keys(tally)
      .map(title => ({
        title,
        rating: library.find(b => b.title === title)?.rating || 0,
        count: tally[title],
        cover: library.find(b => b.title === title)?.cover_url || null,
      }))
      .filter(b => b.rating > 0)
      .sort((a, b) => b.rating - a.rating || b.count - a.count)[0] || null;

    // Distinct reading days + longest streak within the year.
    const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const dayKeys = new Set(reads.map(l => keyFor(new Date(l.timestamp))));
    const days = Array.from(dayKeys)
      .map(k => {
        const [yy, m, d] = k.split('-').map(Number);
        return new Date(yy, m, d);
      })
      .sort((a, b) => a.getTime() - b.getTime());
    let longest = 0,
      run = 0;
    let prev: Date | null = null;
    for (const d of days) {
      if (prev) {
        const next = new Date(prev);
        next.setDate(next.getDate() + 1);
        run = keyFor(next) === keyFor(d) ? run + 1 : 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }

    // Busiest month.
    const monthTally = new Array(12).fill(0);
    reads.forEach(l => {
      monthTally[new Date(l.timestamp).getMonth()] += l.count || 1;
    });
    const busiestIdx = monthTally.indexOf(Math.max(...monthTally));
    const busiestMonth =
      totalReads > 0
        ? new Date(y, busiestIdx, 1).toLocaleString('default', { month: 'long' })
        : null;

    // New books added to the library this year.
    const newBooks = library.filter(
      b => b.created_at && new Date(b.created_at).getFullYear() === y
    ).length;

    return { totalReads, uniqueTitles, topBook, favorite, readingDays: dayKeys.size, longest, busiestMonth, newBooks };
  }, [logs, library, readerName, y]);

  const shareText = useMemo(() => {
    const lines = [
      `📚 ${readerName}'s ${y} in Books (Lello)`,
      `${stats.totalReads} reads across ${stats.uniqueTitles} books`,
    ];
    if (stats.topBook) lines.push(`Most read: "${stats.topBook.title}" (${stats.topBook.count}x)`);
    if (stats.favorite) lines.push(`Favorite: "${stats.favorite.title}" ${'⭐'.repeat(stats.favorite.rating)}`);
    if (stats.longest > 1) lines.push(`Longest streak: ${stats.longest} days 🔥`);
    if (stats.busiestMonth) lines.push(`Busiest month: ${stats.busiestMonth}`);
    return lines.join('\n');
  }, [stats, readerName, y]);

  const handleShare = async () => {
    // navigator.share must be called directly in the tap handler (same rule
    // as window.open) — no awaits before it.
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const StatTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-1 backdrop-blur-sm">
      <div className="flex items-center gap-2 opacity-80">{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div>
      <p className="text-2xl font-extrabold leading-tight">{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="p-6 pb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Year in Books</p>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                {readerName} · {y}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/15 rounded-full hover:bg-white/25 active:scale-90 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {stats.totalReads === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={40} className="mx-auto mb-4 opacity-70" />
              <p className="font-bold">No reads logged for {y} yet.</p>
              <p className="text-sm opacity-80 mt-1">The story starts with one book!</p>
            </div>
          ) : (
            <>
              {/* Hero number */}
              <div className="text-center mb-6">
                <p className="text-7xl font-extrabold leading-none tracking-tight">{stats.totalReads}</p>
                <p className="text-sm font-bold opacity-80 mt-2">
                  reads across {stats.uniqueTitles} {stats.uniqueTitles === 1 ? 'book' : 'books'}
                </p>
              </div>

              {/* Top book */}
              {stats.topBook && (
                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4 mb-3 backdrop-blur-sm">
                  <div className="w-12 h-16 bg-white/20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {stats.topBook.cover ? (
                      <img src={stats.topBook.cover} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">On Heavy Rotation</p>
                    <p className="font-extrabold leading-tight line-clamp-2">{stats.topBook.title}</p>
                    <p className="text-xs opacity-80 font-bold mt-0.5">read {stats.topBook.count}×</p>
                  </div>
                </div>
              )}

              {/* Favorite */}
              {stats.favorite && (
                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4 mb-3 backdrop-blur-sm">
                  <div className="w-12 h-16 bg-white/20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {stats.favorite.cover ? (
                      <img src={stats.favorite.cover} className="w-full h-full object-cover" />
                    ) : (
                      <Star size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{y} Favorite</p>
                    <p className="font-extrabold leading-tight line-clamp-2">{stats.favorite.title}</p>
                    <div className="flex mt-1">
                      {[...Array(stats.favorite.rating)].map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-300 text-amber-300" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <StatTile icon={<CalendarDays size={14} />} label="Reading Days" value={String(stats.readingDays)} />
                <StatTile icon={<Flame size={14} />} label="Longest Streak" value={`${stats.longest}d`} />
                {stats.busiestMonth && (
                  <StatTile icon={<BookOpen size={14} />} label="Busiest Month" value={stats.busiestMonth} />
                )}
                <StatTile icon={<Star size={14} />} label="Books Added" value={String(stats.newBooks)} />
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full mt-5 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                {copied ? 'Copied!' : 'Share This Recap'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
