'use client';

import React from 'react';
import { Library as LibraryIcon, BookOpen, Activity } from 'lucide-react';
import type { Tab } from '@/lib/types';

export default function BottomNav({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-100/90 backdrop-blur-xl border-t border-slate-200 px-12 py-6 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            <button onClick={() => onTabChange('library')} className={`transition-all ${activeTab === 'library' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><LibraryIcon size={32} strokeWidth={activeTab === 'library' ? 2.5 : 2} /></button>
            <button onClick={() => onTabChange('home')} className={`transition-all ${activeTab === 'home' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><BookOpen size={32} strokeWidth={activeTab === 'home' ? 2.5 : 2} /></button>
            <button onClick={() => onTabChange('history')} className={`transition-all ${activeTab === 'history' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><Activity size={32} strokeWidth={activeTab === 'history' ? 2.5 : 2} /></button>
        </nav>
    );
}
