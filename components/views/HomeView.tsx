'use client';

import React from 'react';
import { BookOpen, BookMarked, Clock, ChevronRight } from 'lucide-react';
import StreakCard from '@/components/StreakCard';
import { MILESTONES } from '@/lib/constants';
import { daysBetween, dueInDays } from '@/lib/helpers';
import type { Book } from '@/lib/types';

interface HomeViewProps {
  activeReader: string;
  stats: { lifetimeCount: number; currentlyReading: any[]; completed: any[] };
  streak: { current: number; longest: number };
  library: Book[];
  getBookCover: (title: string) => string | null;
  onSelectBook: (item: any) => void;
  onFinishReading: (logId: string | number, finishIso: string) => void;
  onViewBorrowed: () => void;
}

export default function HomeView({
  activeReader, stats, streak, library, getBookCover, onSelectBook, onFinishReading, onViewBorrowed,
}: HomeViewProps) {
  // Borrowed books with an upcoming or past due date — the soonest first.
  const dueSoon = library
    .filter(b => b.ownership_status === 'borrowed' && b.due_date && dueInDays(b.due_date) !== null && (dueInDays(b.due_date) as number) <= 3)
    .sort((a, b) => (dueInDays(a.due_date) as number) - (dueInDays(b.due_date) as number));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <section className="flex flex-col items-center justify-center py-12">
          {/* CHANGED: Label and Value for Lifetime Reads */}
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase mb-2">{activeReader}'s Lifetime Reads</h2>
          <div className="font-mono-tabular text-9xl font-extrabold text-slate-900 tracking-tighter transition-all">{stats.lifetimeCount}</div>
      </section>
      <section className="space-y-8">
        {dueSoon.length > 0 && (() => {
          const overdue = dueSoon.filter(b => (dueInDays(b.due_date) as number) < 0).length;
          const tone = overdue > 0 ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100';
          const iconTone = overdue > 0 ? 'text-rose-500' : 'text-amber-500';
          return (
            <button onClick={onViewBorrowed} className={`w-full text-left p-4 rounded-[2rem] border flex items-center gap-4 shadow-sm active:scale-[0.99] transition-transform ${tone}`}>
              <div className={`w-11 h-11 rounded-2xl bg-white flex items-center justify-center shrink-0 ${iconTone}`}><Clock size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm">
                  {overdue > 0
                    ? `${overdue} borrowed book${overdue > 1 ? 's' : ''} overdue`
                    : `${dueSoon.length} borrowed book${dueSoon.length > 1 ? 's' : ''} due soon`}
                </p>
                <p className="text-xs text-slate-500 font-medium truncate">{dueSoon.map(b => b.title).join(' · ')}</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 shrink-0" />
            </button>
          );
        })()}
        <StreakCard current={streak.current} longest={streak.longest} readerName={activeReader} />
        {(() => {
          const earned = MILESTONES.filter(m => m.test({ lifetime: stats.lifetimeCount, streak: streak.current }));
          if (earned.length === 0) return null;
          return (
            <div>
              <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {earned.map(m => (
                  <div key={m.id} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full pl-2 pr-3 py-1.5 shadow-sm">
                    <span className="text-base leading-none">{m.emoji}</span>
                    <span className="text-xs font-bold text-slate-700">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {stats.currentlyReading.length > 0 && (
          <div>
            <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Currently Reading</h3>
            <div className="space-y-3">
              {stats.currentlyReading.map((l) => {
                const lib = library.find(b => b.title === l.book_title);
                const cover = getBookCover(l.book_title);
                const day = daysBetween(l.started_at, new Date().toISOString());
                return (
                  <div key={l.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                    <button
                      onClick={() => lib && onSelectBook({ ...lib, cover: lib.cover_url || undefined, ownershipStatus: lib.ownership_status, inWishlist: lib.in_wishlist, rating: lib.rating, memo: lib.memo || undefined, shelves: lib.shelves })}
                      className="flex items-center gap-4 flex-1 text-left min-w-0"
                    >
                      <div className="w-12 h-16 rounded-xl bg-amber-100 overflow-hidden flex items-center justify-center text-amber-500 shrink-0 border border-amber-200">
                        {cover ? <img src={cover} className="w-full h-full object-cover" /> : <BookMarked size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 line-clamp-1">{l.book_title}</p>
                        <p className="text-xs text-amber-600 font-bold">Day {day} · since {l.started_at ? new Date(l.started_at).toLocaleDateString() : ''}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => onFinishReading(l.id, new Date().toISOString())}
                      className="px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold active:scale-95 transition-transform shrink-0"
                    >
                      Finish
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Heavy Rotation</h3>
          <div className="grid grid-cols-3 gap-3">
             {Object.values(stats.completed.reduce((acc: any, item) => {
                 const key = item.book_title;
                 if (!acc[key]) {
                     acc[key] = {
                         id: item.id,
                         title: item.book_title,
                         author: item.book_author,
                         count: 0,
                         cover: getBookCover(item.book_title)
                     };
                 }
                 acc[key].count++;
                 return acc;
             }, {})).sort((a: any, b: any) => b.count - a.count).slice(0, 3).map((item: any) => (
               <button key={item.id} onClick={() => onSelectBook(item)} className="relative aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden border border-slate-300 transition-transform active:scale-[0.98] group">
                 {item.cover ? <img src={item.cover} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={24} /></div>}
                 <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">{item.count}</div>
               </button>
             ))}
             {stats.completed.length === 0 && (<div className="col-span-3 py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-bold">No reading history yet.</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
