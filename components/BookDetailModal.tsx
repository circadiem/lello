'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Clock, StickyNote, Calendar, Star, Heart, Library, Plus, Tag } from 'lucide-react';

interface DisplayItem {
  id: string | number;
  title: string;
  author: string;
  cover?: string;
  cover_url?: string | null;
  reader?: string;
  timestamp?: string;
  count?: number;
  ownershipStatus?: 'owned' | 'borrowed'; // Removed 'wishlist' as status
  inWishlist?: boolean;                   // Decoupled Flag
  rating?: number;                        // 1-5
  memo?: string;                          // General note
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

    // Sync state if book changes
    useEffect(() => {
        if (book) {
            setMemo(book.memo || '');
            setRating(book.rating || 0);
        }
    }, [book]);

    if (!book) return null;

    const currentShelves = book.shelves || [];
    const coverImage = book.cover || book.cover_url;

    // Handle Memo Save (on blur)
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
                    
                    {/* Title & Author */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">{book.title}</h2>
                        <p className="text-slate-500 font-bold text-lg">{book.author}</p>
                    </div>

                    {/* ACTIONS ROW: Rating & Status */}
                    <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        
                        {/* 1. Star Rating */}
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => { setRating(star); onUpdateRating(String(book.id), star); }}
                                    className="focus:outline-none transition-transform active:scale-90"
                                >
                                    <Star 
                                        size={24} 
                                        fill={(hoverRating || rating) >= star ? "#fbbf24" : "none"} 
                                        className={(hoverRating || rating) >= star ? "text-amber-400" : "text-slate-300"} 
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

                        {/* 2. Status Toggles */}
                        <div className="flex gap-2">
                            {/* Owned / Borrowed Toggle */}
                            <button 
                                onClick={() => onUpdateStatus(String(book.id), book.ownershipStatus === 'owned' ? 'borrowed' : 'owned')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${book.ownershipStatus === 'borrowed' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {book.ownershipStatus === 'borrowed' ? <Clock size={14} /> : <Library size={14} />}
                                {book.ownershipStatus === 'borrowed' ? 'Borrowed' : 'Owned'}
                            </button>

                            {/* Wishlist Toggle */}
                            <button 
                                onClick={() => onUpdateWishlist(String(book.id), !book.inWishlist)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${book.inWishlist ? 'bg-rose-100 text-rose-600' : 'bg-white border border-slate-200 text-slate-400 hover:text-rose-400'}`}
                            >
                                <Heart size={14} fill={book.inWishlist ? "currentColor" : "none"} />
                                {book.inWishlist ? 'Registry' : 'Wishlist'}
                            </button>
                        </div>
                    </div>

                    {/* NEW: Shelves Manager */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3 pl-1">
                            <Tag size={12} className="text-slate-400" />
                            <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Shelves & Tags</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {currentShelves.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                                    {tag}
                                    <button onClick={() => handleRemoveShelf(tag)} className="hover:text-red-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            
                            {isAddingShelf ? (
                                <input 
                                    autoFocus
                                    type="text"
                                    placeholder="Tag name..."
                                    className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-900 outline-none w-32"
                                    value={newShelf}
                                    onChange={(e) => setNewShelf(e.target.value)}
                                    onBlur={handleAddShelf}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddShelf()}
                                />
                            ) : (
                                <button 
                                    onClick={() => setIsAddingShelf(true)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-600 transition-all"
                                >
                                    <Plus size={12} /> Add Tag
                                </button>
                            )}
                        </div>
                    </div>

                    {/* MEMO / MEMORY FIELD */}
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

                    {/* Reading History */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                                <Calendar size={14} />
                                Reading History
                            </label>
                            <button onClick={() => onReadAgain(book)} className="text-xs font-bold text-emerald-600 hover:underline">
                                + Log Read
                            </button>
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

                    {/* Footer Actions */}
                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                         <button onClick={() => { onDeleteAsset(book.title); onClose(); }} className="text-red-400 text-xs font-bold hover:text-red-600 flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} /> Delete Book Asset
                         </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
