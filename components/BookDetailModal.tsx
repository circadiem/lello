'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Clock, StickyNote, Calendar, Star, Library, Plus, Tag, Gift } from 'lucide-react';

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
  inWishlist?: boolean;
  rating?: number;
  memo?: string;
  shelves?: string[]; 
}

interface HistoryItem {
  id: string | number;
  title: string;
  author: string;
  reader: string;
  timestamp: string;
  notes?: string;
}

interface BookDetailModalProps {
  book: DisplayItem | null; 
  history: HistoryItem[];
  onClose: () => void;
  onReadAgain: (book: any) => void;
  onRemove: (id: string | number) => void;
  onDeleteAsset: (title: string) => void;
  onUpdateStatus: (id: string, status: 'owned' | 'borrowed') => void;
  onUpdateWishlist: (id: string, inWishlist: boolean) => void;
  onUpdateRating: (id: string, rating: number) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onUpdateShelves: (id: string | number, shelves: string[]) => void;
}

export default function BookDetailModal({ 
    book, history, onClose, onReadAgain, onRemove, onDeleteAsset, 
    onUpdateStatus, onUpdateWishlist, onUpdateRating, onUpdateMemo, onUpdateShelves 
}: BookDetailModalProps) {
    
    const [memo, setMemo] = useState(book?.memo || '');
    const [rating, setRating] = useState(book?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        if (book) {
            setMemo(book.memo || '');
            setRating(book.rating || 0);
        }
    }, [book]);

    if (!book) return null;

    const coverImage = book.cover || book.cover_url;
    const totalReads = book.count || history.length || 0;
    const isOwned = book.ownershipStatus === 'owned';

    const handleMemoBlur = () => {
        if (memo !== book.memo) {
            onUpdateMemo(String(book.id), memo);
        }
    };

    return (
        // z-[9999] ensures this is the absolute top layer
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                
                {/* Header Background */}
                <div className="h-40 bg-slate-100 relative shrink-0 overflow-hidden">
                    {coverImage && (
                        <>
                            {/* FIX: Use real <img> tag instead of CSS background-image to guarantee loading */}
                            <img 
                                src={coverImage} 
                                alt="Blur Background"
                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-110" 
                            />
                            {/* Gradient Overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                        </>
                    )}
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-500 hover:bg-white transition-all shadow-sm z-50">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pb-8 overflow-y-auto">
                    
                    {/* Header Row: Cover + Text */}
                    <div className="relative -mt-12 mb-8 flex items-end gap-6">
                        
                        {/* Cover Image */}
                        <div className="w-28 aspect-[2/3] shrink-0 bg-white rounded-xl shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center relative z-10">
                            {coverImage ? (
                                <img src={coverImage} className="w-full h-full object-cover" /> 
                            ) : (
                                <BookOpen size={32} className="text-slate-300" />
                            )}
                        </div>

                        {/* Title & Author */}
                        <div className="flex-1 min-w-0 pb-1 text-left relative z-10">
                            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1 text-left">{book.title}</h2>
                            <p className="text-slate-500 font-bold text-lg text-left">{book.author}</p>
                        </div>
                    </div>

                    {/* Stats & Toggles */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-1 text-center">
                            <span className="text-3xl font-extrabold text-slate-900">{totalReads}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Reads</span>
                        </div>

                        <div className="p-2 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                           <div className="flex bg-slate-200/50 p-1 rounded-2xl h-full relative">
                                <button 
                                    onClick={() => onUpdateStatus(String(book.id), 'owned')}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${isOwned ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Library size={20} strokeWidth={2.5} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Owned</span>
                                </button>
                                <button 
                                    onClick={() => onUpdateStatus(String(book.id), 'borrowed')}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${!isOwned ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Clock size={20} strokeWidth={2.5} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Borrowed</span>
                                </button>
                           </div>
                        </div>
                    </div>

                    {/* STARS (Centered) */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => { setRating(star); onUpdateRating(String(book.id), star); }}
                                    className="focus:outline-none transition-transform active:scale-90 p-1"
                                >
                                    <Star 
                                        size={32} 
                                        fill={(hoverRating || rating) >= star ? "#fbbf24" : "none"} 
                                        className={(hoverRating || rating) >= star ? "text-amber-400" : "text-slate-300"} 
                                        strokeWidth={(hoverRating || rating) >= star ? 0 : 2}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Registry Button */}
                    {!isOwned && (
                        <button 
                            onClick={() => {
                                onUpdateWishlist(String(book.id), !book.inWishlist);
                                onClose();
                            }}
                            className={`w-full mb-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${book.inWishlist ? 'bg-rose-100 text-rose-600 border border-rose-200 hover:bg-rose-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'}`}
                        >
                            <Gift size={18} />
                            {book.inWishlist ? 'Remove from Registry' : 'Add to Registry (Wishlist)'}
                        </button>
                    )}
                    
                    {/* Memo */}
                    <div className="mb-8">
                        <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                            <StickyNote size={14} />
                            Book Memory
                        </label>
                        <textarea 
                            className="w-full bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all resize-none leading-relaxed"
                            placeholder="e.g. Grandma gave this to Leo for his 3rd birthday..."
                            rows={3}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            onBlur={handleMemoBlur}
                        />
                    </div>

                    {/* History */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                                <Calendar size={14} />
                                Reading History
                            </label>
                        </div>
                        
                        <div className="space-y-3">
                            {history.length > 0 ? (
                                history.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                {log.reader?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                {log.notes && <p className="text-xs text-slate-500 italic">"{log.notes}"</p>}
                                            </div>
                                        </div>
                                        <button onClick={() => onRemove(log.id)} className="text-slate-300 hover:text-red-400 p-2">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-xs text-slate-400 font-bold">No logs yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Action */}
                    <div className="mt-8 p-4 bg-white border-t border-slate-100">
                        <button onClick={() => onReadAgain(book)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Plus size={20} strokeWidth={3} />
                            Log Another Read
                        </button>
                    </div>

                    <div className="mt-4 flex justify-center">
                         <button onClick={() => { onDeleteAsset(book.title); onClose(); }} className="text-red-400 text-xs font-bold hover:text-red-600 flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} /> Delete Book Asset
                         </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
