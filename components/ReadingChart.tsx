'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ReadingChart({ data }: { data: { day: string, count: number, isToday: boolean }[] }) {
    const max = Math.max(...data.map(d => d.count), 4);
    return (
        <div className="w-full h-56 bg-slate-900 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-xl mb-8 overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">This Week</p>
                    <p className="text-white font-bold text-xl">Weekly Count</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-full text-emerald-400">
                    <BarChart3 size={20} />
                </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-full pb-2 px-2">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full relative group flex items-end justify-center h-24">
                            <div
                                style={{ height: `${(item.count / max) * 100}%` }}
                                className={`w-full max-w-[12px] rounded-full transition-all duration-500 min-h-[4px] ${item.isToday ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-700 group-hover:bg-slate-600'}`}
                            />
                            {item.count > 0 && (
                                <div className="absolute -top-8 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md">
                                    {item.count}
                                </div>
                            )}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${item.isToday ? 'text-white' : 'text-slate-500'}`}>
                            {item.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
