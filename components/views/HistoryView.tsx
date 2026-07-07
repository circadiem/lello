'use client';

import React from 'react';
import { BookOpen, Plus } from 'lucide-react';
import ReadingChart from '@/components/ReadingChart';
import StreakCard from '@/components/StreakCard';

interface HistoryViewProps {
  stats: { dailyCount: number; weeklyCount: number; goals: { daily: number; weekly: number }; readerLog: any[] };
  chartData: { day: string, count: number, isToday: boolean }[];
  streak: { current: number; longest: number };
  activeReader: string;
  groupedHistory: { today: any[]; yesterday: any[]; week: any[]; older: any[] };
  onSelectBook: (item: any) => void;
  onQuickAdd: (e: React.MouseEvent, item: any) => void;
  onOpenGoal: (type: 'daily' | 'weekly') => void;
}

export default function HistoryView({
  stats, chartData, streak, activeReader, groupedHistory,
  onSelectBook, onQuickAdd, onOpenGoal,
}: HistoryViewProps) {
    const isDailyGoalMet = stats.dailyCount >= stats.goals.daily;
    const isWeeklyGoalMet = stats.weeklyCount >= stats.goals.weekly;

    const renderBookList = (items: any[], title: string) => (
        <div className="mb-6">
            <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3 pl-2">{title}</h3>
            <div className="space-y-3">
                {items.map((item: any) => (
                    <div key={item.id} className="w-full bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                        <button onClick={() => onSelectBook(item)} className="flex items-center gap-4 flex-1 text-left">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm shrink-0 overflow-hidden">
                                {item.cover ? <img src={item.cover} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                                <p className="text-xs text-slate-500 font-medium line-clamp-1">{item.author}</p>
                            </div>
                        </button>
                        <div className="flex items-center gap-3">
                            {item.dailyCount > 1 && (<span className="font-mono-tabular font-bold text-slate-400 text-sm">{item.dailyCount}x</span>)}
                            <button onClick={(e) => onQuickAdd(e, item)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Plus size={18} strokeWidth={3} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h1 className="text-4xl font-extrabold tracking-tight pt-4 mb-6">Activity</h1>
            <ReadingChart data={chartData} />
            <div className="mb-6"><StreakCard current={streak.current} longest={streak.longest} readerName={activeReader} /></div>
            <div className="space-y-4 mb-8">
                <button onClick={() => onOpenGoal('daily')} className={`w-full text-left p-6 rounded-[2.5rem] shadow-sm border transition-all duration-500 relative overflow-hidden active:scale-[0.98] ${isDailyGoalMet ? 'bg-[#008f68] text-white border-transparent shadow-xl shadow-emerald-900/10' : 'bg-white text-slate-900 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-1 relative z-10"><div className="space-y-0.5"><p className={`text-[10px] font-bold uppercase tracking-widest ${isDailyGoalMet ? 'opacity-80' : 'text-slate-400'}`}>Daily Goal</p><p className="text-xl font-bold">{isDailyGoalMet ? 'Goal Achieved! ✨' : `${stats.goals.daily - stats.dailyCount} more to reach target`}</p></div><p className={`font-mono-tabular font-bold text-lg ${isDailyGoalMet ? 'opacity-90' : 'text-slate-400'}`}>{stats.dailyCount}/{stats.goals.daily}</p></div>
                    <div className={`mt-4 h-2 rounded-full overflow-hidden ${isDailyGoalMet ? 'bg-emerald-400/30' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all duration-1000 ease-out ${isDailyGoalMet ? 'bg-white' : 'bg-slate-900'}`} style={{ width: `${Math.min((stats.dailyCount / stats.goals.daily) * 100, 100)}%` }} /></div>
                </button>
                <button onClick={() => onOpenGoal('weekly')} className={`w-full text-left p-6 rounded-[2.5rem] shadow-sm border transition-all duration-500 relative overflow-hidden active:scale-[0.98] ${isWeeklyGoalMet ? 'bg-[#008f68] text-white border-transparent shadow-xl shadow-emerald-900/10' : 'bg-white text-slate-900 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-1 relative z-10"><div className="space-y-0.5"><p className={`text-[10px] font-bold uppercase tracking-widest ${isWeeklyGoalMet ? 'opacity-80' : 'text-slate-400'}`}>Weekly Goal</p><p className="text-xl font-bold">{isWeeklyGoalMet ? 'Weekly Target Met! 🏆' : `${stats.goals.weekly - stats.weeklyCount} more to reach target`}</p></div><p className={`font-mono-tabular font-bold text-slate-400 ${isWeeklyGoalMet ? 'opacity-90' : 'text-slate-400'}`}>{stats.weeklyCount}/{stats.goals.weekly}</p></div>
                    <div className={`mt-4 h-2 rounded-full overflow-hidden ${isWeeklyGoalMet ? 'bg-emerald-400/30' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all duration-1000 ease-out ${isWeeklyGoalMet ? 'bg-white' : 'bg-slate-900'}`} style={{ width: `${Math.min((stats.weeklyCount / stats.goals.weekly) * 100, 100)}%` }} /></div>
                </button>
            </div>
            {groupedHistory.today.length > 0 && renderBookList(groupedHistory.today, 'Today')}
            {groupedHistory.yesterday.length > 0 && renderBookList(groupedHistory.yesterday, 'Yesterday')}
            {groupedHistory.week.length > 0 && renderBookList(groupedHistory.week, 'Earlier This Week')}
            {stats.readerLog.length === 0 && (<div className="text-center py-10 text-slate-400 text-sm font-medium">No reading activity yet. Start logging some books!</div>)}
        </div>
    );
}
