'use client';

import React, { useEffect } from 'react';

export interface Milestone {
  id: string;
  label: string;
  emoji: string;
}

interface MilestoneToastProps {
  milestone: Milestone;
  onDone: () => void;
}

// A celebratory banner shown once when a reader crosses a milestone
// (e.g. their first book, a 7-day streak). Auto-dismisses.
export default function MilestoneToast({ milestone, onDone }: MilestoneToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [milestone, onDone]);

  return (
    <div className="fixed inset-x-0 top-6 z-[130] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-900 text-white rounded-2xl pl-4 pr-5 py-3 shadow-2xl animate-in slide-in-from-top-6 fade-in duration-300">
        <span className="text-2xl leading-none">{milestone.emoji}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Achievement unlocked</p>
          <p className="font-extrabold leading-tight">{milestone.label}</p>
        </div>
      </div>
    </div>
  );
}
