
'use client';

import React, { useState } from 'react';
import { 
  ScanBarcode, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  UserPlus, 
  Check,
  Plus
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function LibraryPage() {
  const [showReaderMenu, setShowReaderMenu] = useState(false);
  const [activeReader, setActiveReader] = useState('Leo');
  const readers = ['Leo', 'Maya'];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-40">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-50/90 backdrop-blur-md z-[100] flex items-center justify-between px-6 py-4">
        <button className="p-2 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
          <ScanBarcode size={28} strokeWidth={1.5} className="text-slate-900" />
        </button>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
            <Search size={28} strokeWidth={1.5} className="text-slate-400" />
          </button>
          
          {/* Reader Avatar & Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowReaderMenu(!showReaderMenu)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 active:scale-90 transition-transform"
            >
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeReader}`} 
                alt="Reader Avatar" 
                className="w-full h-full object-cover bg-orange-100"
              />
            </button>

            {showReaderMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowReaderMenu(false)} />
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Reader</div>
                  {readers.map(name => (
                    <button 
                      key={name}
                      onClick={() => { setActiveReader(name); setShowReaderMenu(false); }}
                      className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-bold text-slate-900">{name}</span>
                      {activeReader === name && <Check size={18} className="text-emerald-500" strokeWidth={3} />}
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 my-2 mx-4" />
                  <button className="w-full px-5 py-3 flex items-center gap-2 text-slate-400 hover:bg-slate-50 transition-colors">
                    <UserPlus size={18} strokeWidth={2.5} />
                    <span className="font-bold">Add Reader</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="mt-20 px-6 max-w-lg mx-auto w-full space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight pt-4">Library</h1>

        {/* Portfolio Summary Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Assets</p>
            <p className="text-5xl font-mono-tabular font-extrabold tracking-tighter">18</p>
            <div className="flex gap-4 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Owned <span className="text-slate-900">12</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Borrowed <span className="text-slate-900">6</span></span>
            </div>
          </div>
          <ChevronRight className="text-slate-200 group-hover:text-slate-400 transition-colors" size={32} />
        </div>

        {/* Goal Performance: Daily */}
        <div className="bg-[#008f68] p-6 rounded-[2.5rem] shadow-xl shadow-emerald-900/10 text-white relative overflow-hidden">
          <div className="flex justify-between items-start mb-1">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Daily Goal</p>
              <p className="text-xl font-bold">Goal Achieved! ✨</p>
            </div>
            <p className="font-mono-tabular font-bold text-lg opacity-90">3/3</p>
          </div>
          <div className="mt-4 h-2 bg-emerald-400/30 rounded-full">
            <div className="h-full bg-white w-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        </div>

        {/* Goal Performance: Weekly */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Goal</p>
              <p className="text-xl font-bold">11 more to reach target</p>
            </div>
            <p className="font-mono-tabular font-bold text-slate-400">4/15</p>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-900 w-[26%] rounded-full transition-all duration-1000 ease-out" />
          </div>
        </div>

        {/* Trend Cards (The Market View) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Weekly Trend</p>
            <div className="flex items-center gap-1 text-emerald-500 font-bold">
              <TrendingUp size={18} strokeWidth={3} />
              <span className="text-2xl font-mono-tabular">+12%</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">vs. last week</p>
          </div>
          
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Monthly Trend</p>
            <div className="flex items-center gap-1 text-rose-500 font-bold">
              <TrendingDown size={18} strokeWidth={3} />
              <span className="text-2xl font-mono-tabular">-5%</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">vs. last month</p>
          </div>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex justify-center pt-4">
          <div className="inline-flex bg-slate-200/50 p-1 rounded-full border border-slate-200">
            {['Week', 'Month', 'Quarter', 'Year'].map((period) => (
              <button 
                key={period}
                className={`px-5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                  period === 'Week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button className="pointer-events-auto bg-slate-900 text-slate-50 px-10 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95 transition-transform hover:bg-slate-800">
          <Plus size={20} strokeWidth={3} />
          <span>Add</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
