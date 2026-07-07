'use client';

import React from 'react';
import { Settings, Edit3, Trash2, UserPlus, LogOut } from 'lucide-react';
import { getAvatarUrl } from '@/lib/helpers';

interface ParentDashboardProps {
  readers: string[];
  readerAvatars: Record<string, string>;
  readerGoals: Record<string, { daily: number; weekly: number }>;
  onOpenAvatar: (name: string) => void;
  onDeleteChild: (name: string) => void;
  onUpdateChildGoal: (child: string, type: 'daily' | 'weekly', value: number) => void;
  onAddChild: () => void;
  onShowYearReview: () => void;
  onChangePin: () => void;
  onResetApp: () => void;
  onLogout: () => void;
  onExitParentMode: () => void;
}

export default function ParentDashboard({
  readers, readerAvatars, readerGoals,
  onOpenAvatar, onDeleteChild, onUpdateChildGoal, onAddChild,
  onShowYearReview, onChangePin, onResetApp, onLogout, onExitParentMode,
}: ParentDashboardProps) {
  return (
      <div className="animate-in fade-in zoom-in-95 duration-300 pb-20">
          <div className="flex items-center gap-4 py-6 mb-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Settings size={24} /></div>
             <div><h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parent's Corner</h1><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Admin Dashboard</p></div>
          </div>
          <div className="space-y-6">
              <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Family Goals & Profiles</h3>
                  <div className="space-y-6">
                      {readers.map(kid => (
                          <div key={kid} className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                              <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                      <button onClick={() => onOpenAvatar(kid)} className="relative group"><img src={getAvatarUrl(kid, readerAvatars)} className="w-10 h-10 rounded-full bg-white shadow-sm object-cover" /><div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={12} className="text-white" /></div></button>
                                      <span className="font-bold text-slate-900 text-lg">{kid}</span>
                                  </div>
                                  {readers.length > 0 && kid !== readers[readers.length - 1] && <button onClick={() => onDeleteChild(kid)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={18} /></button>}
                              </div>
                              {readers.length > 0 && kid !== readers[readers.length - 1] && (<div className="space-y-3 pl-14"><div><div className="flex justify-between text-xs font-bold text-slate-400 mb-1"><span>DAILY GOAL</span><span className="text-slate-900">{(readerGoals[kid] || readerGoals['default']).daily} books</span></div><input type="range" min="1" max="10" value={(readerGoals[kid] || readerGoals['default']).daily} onChange={(e) => onUpdateChildGoal(kid, 'daily', parseInt(e.target.value))} className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" /></div><div><div className="flex justify-between text-xs font-bold text-slate-400 mb-1"><span>WEEKLY GOAL</span><span className="text-slate-900">{(readerGoals[kid] || readerGoals['default']).weekly} books</span></div><input type="range" min="5" max="50" step="1" value={(readerGoals[kid] || readerGoals['default']).weekly} onChange={(e) => onUpdateChildGoal(kid, 'weekly', parseInt(e.target.value))} className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" /></div></div>)}
                          </div>
                      ))}
                      <button onClick={onAddChild} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95"><UserPlus size={18} /><span>Add Child</span></button>
                  </div>
              </section>
              <button
                  onClick={onShowYearReview}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                  ✨ {new Date().getFullYear()} Year in Books
              </button>

              <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">System</h3>
                  <button onClick={onChangePin} className="w-full py-3 bg-slate-100 text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors mb-2">Change Parent PIN</button>
                  <button onClick={onResetApp} className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors">Factory Reset App</button>
                  <button onClick={onLogout} className="w-full py-3 bg-slate-100 text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors mt-2">Log Out</button>
              </section>
              <button onClick={onExitParentMode} className="w-full py-4 bg-slate-900 text-white font-bold rounded-[2rem] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"><LogOut size={18} /><span>Exit Parent Mode</span></button>
          </div>
      </div>
  );
}
