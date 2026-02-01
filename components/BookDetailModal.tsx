'use client';

import React from 'react';
import { X, BookOpen, Clock, Trash2, RotateCcw, CheckCircle2, StickyNote } from 'lucide-react';

// Reusing the strict types to keep Vercel happy
interface DisplayItem {
  id: string | number;
  title: string;
  author: string;
  cover?: string;
  cover_url?: string | null;
  reader?: string;
  timestamp?: string;
  count?: number;
  ownershipStatus?: 'owned' | 'borrowed';
}

interface HistoryItem {
  id: string | number;
  title: string;
  author: string;
  reader: string;
  timestamp: string;
}

interface BookDetailModalProps {
  book: DisplayItem | null;
  history: HistoryItem[];
  onClose: () => void;
  onReadAgain: (book: DisplayItem) => void;
  onRemove: (id: string | number) => void; // Deletes a single log
  onDeleteAsset?: (title: string) => void; // Deletes the book entirely from library
  onToggleStatus: (id: string | number, status: 'owned' | 'borrowed') => void;
}

export default function BookDetailModal({ 
    book, 
    history, 
    onClose, 
    onReadAgain, 
    onRemove, 
    onDeleteAsset, // New prop
    onToggleStatus 
}: BookDetailModalProps) {
  
  if (!book) return null;

  const coverImage = book.cover || book.cover_url;
  const isBorrowed = book.ownershipStatus === 'borrowed';

  const handleDeleteLibraryBook = () => {
      if (confirm(`Delete "${book.title}" from your Library entirely? This cannot be undone.`)) {
          if (onDeleteAsset) {
              onDeleteAsset(book.title);
              onClose();
          }
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-[90vh] sm:h-auto bg-slate-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header Image */}
        <div className="relative h-48 bg-slate-200">
            {coverImage ? (
                <>
                    <div className="absolute inset-0 bg-black/10 z-10" />
                    <img src={coverImage} className="w-full h-full object-cover blur-xl opacity-50" />
                    <img src={coverImage} className="absolute bottom-[-40px] left-8 w-24 h-36 object-cover rounded-xl shadow-2xl z-20 border-2 border-white" />
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <BookOpen size={48} className="text-slate-300" />
                </div>
            )}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md z-30 transition-all">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="px-8 pt-12 pb-8 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{book.title}</h2>
            <p className="text-lg text-slate-500 font-medium mb-6">{book.author}</p>

            {/* Stats Row */}
            <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <div className="text-2xl font-extrabold text-slate-900">{history.length}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Reads</div>
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <div className="text-2xl font-extrabold text-slate-900">{history.length > 0 ? new Date(history[0].timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Read</div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-8">
                <button onClick={() => onReadAgain(book)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <RotateCcw size={18} />
                    Read Again
                </button>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => onToggleStatus(book.id, isBorrowed ? 'owned' : 'borrowed')} 
                        className={`flex-1 py-3 font-bold rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${isBorrowed ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                        {isBorrowed ? <StickyNote size={18} /> : <CheckCircle2 size={18} />}
                        {isBorrowed ? 'Borrowed' : 'Owned'}
                    </button>
                    
                    {/* Delete Entire Asset Button */}
                    <button 
                        onClick={handleDeleteLibraryBook} 
                        className="flex-1 py-3 font-bold rounded-xl border-2 border-red-100 bg-red-50 text-red-500 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={18} />
                        Delete Asset
                    </button>
                </div>
            </div>

            {/* History List */}
            {history.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Reading History</h3>
                    <div className="space-y-3">
                        {history.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Clock size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{new Date(log.timestamp).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                                <button onClick={() => onRemove(log.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
