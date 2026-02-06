'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Clock, StickyNote, Calendar, Star, Heart, Library, Plus, Tag, Gift } from 'lucide-react';

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
    
    // Shelves State
    const [isAddingShelf, setIsAddingShelf] = useState(false);
    const [newShelf, setNewShelf] = useState('');

    useEffect(() => {
        if (book) {
            setMemo(book.memo || '');
            setRating(book.rating || 0);
        }
    }, [book]);

    if (!book) return null;

    const currentShelves = book.shelves || [];
    const coverImage = book.cover || book.cover_url;
    const totalReads = book.count || history.length || 0;
    const isOwned = book.ownershipStatus === 'owned';

    const handleMemoBlur = () => {
        if (memo !== book.memo) {
            onUpdateMemo(String(book.id), memo);
        }
    };

    const handleAddShelf = () => {
        if (!newShelf.trim()) {
            setIsAddingShelf(false);
            return;
        }
        const updated = [...currentShelves, newShelf.trim()];
        const unique = Array.from(new Set(updated));
        onUpdateShelves(book.id, unique);
        setNewShelf('');
        setIsAddingShelf(false);
    };
  
    const handleRemoveShelf = (tagToRemove: string) => {
        const updated = currentShelves.filter(s => s !== tagToRemove);
        onUpdateShelves(book.id, updated);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                
                {/* Header Image */}
                <div className="h-48 bg-slate-100 relative shrink-0">
                    {coverImage ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-50" style={{ backgroundImage: `url(${coverImage})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                            <img src={coverImage} className="absolute bottom-[-20px] left-8 w-28 h-40 object-cover rounded-xl shadow-2xl border-4 border-white" />
                        </>
                    ) : (
                        <div className="absolute bottom-[-20px] left-8 w-28 h-40 bg-slate-200 rounded-xl shadow-2xl border-4 border-white flex items-center justify-center text-slate-400">
                            <BookOpen size={40} />
                        </div>
                    )}
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-500 hover:bg-white transition-all shadow-sm z-10">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pt-10 pb-8 overflow-y-auto">
                    
                    {/* Title & Author (Left Aligned) */}
                    <div className="mb-8 text-left pl-36 sm:pl-0 pt-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">{book.title}</h2>
                        <p className="text-slate-500 font-bold text-lg">{book.author}</p>
                    </div>

                    {/* Stats & Toggles Grid */}
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

                    {/* Shelves & Stars Row (Fixed Layout) */}
                    <div className="flex items-end justify-between gap-2 mb-8">
                        
                        {/* Shelves (Left) */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 pl-1">
                                <Tag size={12} className="text-slate-400" />
                                <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Shelves & Tags</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {currentShelves.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200">
                                        {tag}
                                        <button onClick={() => handleRemoveShelf(tag)} className="hover:text-red-500 transition-colors">
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                {isAddingShelf ? (
                                    <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Tag..."
                                        className="px-2 py-1.5 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-900 outline-none w-20"
                                        value={newShelf}
                                        onChange={(e) => setNewShelf(e.target.value)}
                                        onBlur={handleAddShelf}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddShelf()}
                                    />
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingShelf(true)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-600 transition-all"
                                    >
                                        <Plus size={10} /> Add
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stars (Right) */}
                        <div className="flex gap-0.5 shrink-0 pb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => { setRating(star); onUpdateRating(String(book.id), star); }}
                                    className="focus:outline-none transition-transform active:scale-90 p-1"
                                >
                                    <Star 
                                        size={22} 
                                        fill={(hoverRating || rating) >= star ? "#fbbf24" : "none"} 
                                        className={(hoverRating || rating) >= star ? "text-amber-400" : "text-slate-300"} 
                                        strokeWidth={(hoverRating || rating) >= star ? 0 : 2}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Registry Button (Only if NOT owned) */}
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
                    
                    {/* Memo & History sections remain identical */}
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
