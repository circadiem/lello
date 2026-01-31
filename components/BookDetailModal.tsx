'use client';

import React, { useState } from 'react';
import { X, BookOpen, Star, Share, Heart, History, Sparkles, Trash2, Home, Library } from 'lucide-react';

interface BookAsset {
  id: number | string;
  title: string;
  author: string;
  cover?: string;
  count?: number;
  rating?: number;
  analystNote?: string;
  timestamp?: string;
  reader?: string;
  ownershipStatus?: 'owned' | 'borrowed'; // NEW
}

interface BookDetailModalProps {
  book: BookAsset | null;
  history: BookAsset[];
  onClose: () => void;
  onReadAgain: (book: BookAsset) => void;
  onRemove: (id: number | string) => void;
  onToggleStatus: (id: number | string, newStatus: 'owned' | 'borrowed') => void; // NEW
}

export default function BookDetailModal({ book, history = [], onClose, onReadAgain, onRemove, onToggleStatus }: BookDetailModalProps) {
  const [userRating, setUserRating] = useState(book?.rating || 0);

  if (!book) return null;

  const handleDelete = () => {
    if (window.confirm("Remove this entry?")) {
      onRemove(book.id);
    }
  };

  const currentStatus = book.ownershipStatus || 'owned'; // Default to owned

  // --- SAFE DATE HELPERS ---
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown Date';
    if (!isoString.includes('T') && !isoString.includes('-')) return isoString;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(date);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-end sm:justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity pointer-events-auto"
        onClick={onClose}
      />
      <div className="pointer-events-auto relative w-full max-w-lg h-[92vh] sm:h-[800px] bg-slate-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 bg-white/50 backdrop-blur-md z-10">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center px-6 py-2">
            <div className="flex gap-2">
                <button 
                    onClick={handleDelete}
                    className="p-2 bg-red-50 border border-red-100 rounded-full text-red-400 hover:bg-red-100 hover:text-red-600 shadow-sm transition-colors active:scale-90"
                >
                    <Trash2 size={20} />
                </button>
                <button className="p-2 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                    <Share size={20} />
                </button>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
               <X size={24} />
            </button>
          </div>

          {/* Book Hero */}
          <div className="flex flex-col items-center px-6 mt-2">
            <div className="w-40 h-60 bg-white rounded-2xl shadow-xl border-4 border-white rotate-1 transition-transform hover:rotate-0 overflow-hidden relative group">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400"><BookOpen size={48} /></div>
                )}
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-slate-900 text-center leading-tight">{book.title}</h2>
            <p className="mt-2 text-slate-500 font-medium text-sm">{book.author}</p>
          </div>

          {/* Stats & Ownership Grid */}
          <div className="grid grid-cols-2 gap-4 px-6 mt-8">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Status</span>
              
              {/* STATUS TOGGLE */}
              <div className="flex items-center bg-slate-100 rounded-full p-1 mt-1">
                  <button 
                    onClick={() => onToggleStatus(book.id, 'owned')}
                    className={`p-2 rounded-full transition-all ${currentStatus === 'owned' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                      <Home size={18} />
                  </button>
                  <button 
                    onClick={() => onToggleStatus(book.id, 'borrowed')}
                    className={`p-2 rounded-full transition-all ${currentStatus === 'borrowed' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                      <Library size={18} />
                  </button>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                  {currentStatus === 'owned' ? 'Family Owned' : 'Library Book'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reads</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">{history.length}</span>
              </div>
            </div>
          </div>

          {/* Analyst Note */}
          <div className="px-6 mt-6">
            <div className="bg-indigo-50/50 rounded-3xl p-6 relative overflow-hidden border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                   {book.analystNote ? <Sparkles size={14} className="text-indigo-500 fill-indigo-500 animate-pulse" /> : <Heart size={14} className="text-indigo-500 fill-indigo-500" />}
                   <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">{book.analystNote ? 'AI Analyst Thesis' : 'Why We Love It'}</span>
                </div>
                <p className="text-indigo-900/80 text-sm leading-relaxed font-medium">{book.analystNote || "Loading market analysis for this asset..."}</p>
            </div>
          </div>

          {/* REAL Reading History List */}
          <div className="px-6 mt-8 mb-10">
             <div className="flex items-center justify-between mb-4 px-1">
               <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Reading History</h3>
             </div>
             <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {history.map((entry, index) => (
                  <div key={entry.id} className={`flex items-center justify-between p-4 ${index !== history.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <History size={18} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{formatDate(entry.timestamp)}</span>
                          <span className="text-[10px] text-slate-500 font-bold">
                             {formatTime(entry.timestamp) ? `${formatTime(entry.timestamp)} • ` : ''}{entry.reader}
                          </span>
                       </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <div className="p-6 text-center text-slate-400 text-xs">No history found.</div>}
             </div>
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12">
           <button onClick={() => onReadAgain(book)} className="w-full bg-slate-900 text-white font-bold h-14 rounded-full shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
              <BookOpen size={20} strokeWidth={2.5} />
              Read Again
           </button>
        </div>

      </div>
    </div>
  );
}
