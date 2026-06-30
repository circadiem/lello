'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface StreakCardProps {
  current: number;
  longest: number;
  readerName: string;
}

// A warm "habit" card showing the active reader's current reading streak.
// Renders nothing until there's at least one day of history, so brand-new
// readers don't see an empty "0-day streak".
export default function StreakCard({ current, longest, readerName }: StreakCardProps) {
  if (current === 0 && longest === 0) return null;

  const alive = current > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] p-5 border shadow-sm flex items-center gap-4 ${
        alive
          ? 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white border-transparent shadow-xl shadow-orange-500/20'
          : 'bg-white text-slate-900 border-slate-100'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          alive ? 'bg-white/20' : 'bg-slate-100 text-slate-300'
        }`}
      >
        <Flame size={28} className={alive ? 'text-white' : 'text-slate-300'} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${alive ? 'opacity-80' : 'text-slate-400'}`}>
          {alive ? 'Reading Streak' : 'Streak Paused'}
        </p>
        <p className="text-xl font-extrabold leading-tight">
          {alive ? `${current} day${current === 1 ? '' : 's'} in a row` : 'Log a read to restart'}
        </p>
        {longest > 0 && (
          <p className={`text-xs font-bold mt-0.5 ${alive ? 'opacity-80' : 'text-slate-400'}`}>
            {readerName}'s best: {longest} day{longest === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  );
}
