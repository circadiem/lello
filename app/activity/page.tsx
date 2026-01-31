'use client';

import React from 'react';
// Added Clock to the imported icons from lucide-react
import { ScanBarcode, Search, Plus, Book, Check, Clock } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface ActivityItem {
  id: string;
  title: string;
  author: string;
  multiplier: number;
  time: string;
  section: 'TODAY' | 'THIS WEEK' | 'EARLIER';
  color: string;
}

const transactions: ActivityItem[] = [
  {
    id: '1',
    title: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    multiplier: 3,
    time: '2h ago',
    section: 'TODAY',
    color: 'bg-emerald-500',
  },
  {
    id: '2',
    title: 'Goodnight Moon',
    author: 'Margaret Wise Brown',
    multiplier: 1,
    time: '5h ago',
    section: 'TODAY',
    color: 'bg-emerald-500',
  },
  {
    id: '3',
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    multiplier: 2,
    time: 'Tuesday',
    section: 'THIS WEEK',
    color: 'bg-amber-400',
  },
  {
    id: '4',
    title: 'The Gruffalo',
    author: 'Julia Donaldson',
    multiplier: 1,
    time: 'Monday',
    section: 'THIS WEEK',
    color: 'bg-amber-400',
  },
  {
    id: '5',
    title: 'Brown Bear, Brown Bear',
    author: 'Bill Martin Jr.',
    multiplier: 1,
    time: 'Last Friday',
    section: 'EARLIER',
    color: 'bg-slate-300',
  },
];

export default function ActivityPage() {
  const handleQuickLog = (title: string) => {
    // Mocking the 'Quick Log' feature with a simple alert/feedback
    console.log(`Quick logged: ${title}`);
    alert(`Logged another read for: ${title}!`);
  };

  const renderSection = (sectionName: 'TODAY' | 'THIS WEEK' | 'EARLIER') => {
    const filtered = transactions.filter((t) => t.section === sectionName);
    if (filtered.length === 0) return null;

    return (
      <div key={sectionName} className="space-y-4">
        <h3 className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase pt-4">
          {sectionName}
        </h3>
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Visual Icon Circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-inner ${item.color}`}>
                  <Book size={20} strokeWidth={2.5} />
                </div>
                
                {/* Book Details */}
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                    {item.title}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {item.author} • {item.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Multiplier Badge */}
                {item.multiplier > 1 && (
                  <div className="bg-slate-100 px-3 py-1 rounded-full">
                    <span className="font-mono-tabular font-extrabold text-[10px] text-slate-900">
                      {item.multiplier}X
                    </span>
                  </div>
                )}
                
                {/* Quick Action Button */}
                <button 
                  onClick={() => handleQuickLog(item.title)}
                  className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:border-slate-900 transition-all active:scale-90"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Leo" 
              alt="Avatar" 
              className="w-full h-full object-cover bg-orange-100" 
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mt-20 px-6 max-w-lg mx-auto w-full space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-extrabold tracking-tight pt-4 pb-2">Activity</h1>

        {/* Section Groups */}
        {renderSection('TODAY')}
        {renderSection('THIS WEEK')}
        {renderSection('EARLIER')}

        {/* Empty State Mock */}
        {transactions.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Clock size={32} />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No recent activity</p>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
