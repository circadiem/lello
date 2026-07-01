'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Trash2, Clock, StickyNote, Calendar, Star, Library, Plus, Gift, Tag, BookMarked } from 'lucide-react';

// ISO <-> yyyy-MM-dd for <input type="date">, anchoring rebuilt timestamps at
// local noon so a date edit never shifts across a timezone boundary.
const isoToDateInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dateInputToIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
};
// Inclusive whole-day count between two ISO timestamps (day 1 = same day).
const daysBetween = (aIso?: string | null, bIso?: string | null) => {
  if (!aIso || !bIso) return 0;
  const a = new Date(aIso); const b = new Date(bIso);
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((b0.getTime() - a0.getTime()) / 86400000) + 1;
};

/* ... (Interfaces remain the same) ... */
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
  started_at?: string | null;
}

interface ActiveReading {
  id: string | number;
  started_at?: string | null;
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
  onUpdateLogDate: (id: string | number, iso: string) => void;
  allShelves?: string[];
  activeReader?: string;
  activeReading?: ActiveReading | null;
  onStartReading?: (book: { title: string; author: string }, startIso: string) => void;
  onFinishReading?: (logId: string | number, finishIso: string) => void;
  onCancelReading?: (logId: string | number) => void;
}

export default function BookDetailModal({
    book, history, onClose, onReadAgain, onRemove, onDeleteAsset,
    onUpdateStatus, onUpdateWishlist, onUpdateRating, onUpdateMemo, onUpdateShelves,
    onUpdateLogDate, allShelves = [],
    activeReader, activeReading, onStartReading, onFinishReading, onCancelReading
}: BookDetailModalProps) {

    const [memo, setMemo] = useState(book?.memo || '');
    const [rating, setRating] = useState(book?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [shelves, setShelves] = useState<string[]>(book?.shelves || []);
    const [newShelf, setNewShelf] = useState('');
    const [startDate, setStartDate] = useState('');
    const [finishDate, setFinishDate] = useState('');
    const [showStart, setShowStart] = useState(false);

    useEffect(() => {
        if (book) {
            setMemo(book.memo || '');
            setRating(book.rating || 0);
            setShelves(book.shelves || []);
            setNewShelf('');
            const today = isoToDateInput(new Date().toISOString());
            setStartDate(today);
            setFinishDate(today);
            setShowStart(false);
        }
    }, [book]);

    const commitShelves = (next: string[]) => {
        setShelves(next);
        if (book) onUpdateShelves(book.id, next);
    };
    const addShelf = (raw: string) => {
        const name = raw.trim();
        if (!name) return;
        if (shelves.some(s => s.toLowerCase() === name.toLowerCase())) { setNewShelf(''); return; }
        commitShelves([...shelves, name]);
        setNewShelf('');
    };
    const removeShelf = (name: string) => commitShelves(shelves.filter(s => s !== name));
    // Existing shelves from other books that aren't on this one yet (quick-add).
    const suggestions = allShelves.filter(
        s => !shelves.some(cur => cur.toLowerCase() === s.toLowerCase())
    );

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
        /* STRUCTURAL FIX 1: 
           High Z-Index (z-[9999]) guarantees it sits on top of your app header.
           items-center ensures it doesn't get pushed into the status bar on mobile.
        */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            
            {/* STRUCTURAL FIX 2: 
               The Card Container is relative.
               We moved overflow-hidden here to round corners, but we DO NOT scroll here yet.
            */}
            <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                
                {/* STRUCTURAL FIX 3: 
                   The Close Button is now absolutely positioned on the CARD, 
                   so it stays floating even if the content scrolls.
                   z-50 ensures it's clickable above the background image.
                */ }
                <button 
                    onClick={onClose} 
                    className="absolute top-5 right-5 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-500 hover:bg-white transition-all shadow-sm z-50"
                >
                    <X size={20} />
                </button>

                {/* STRUCTURAL FIX 4: 
                   This is the single scroll container. 
                   Both the Header Background AND the Content Body live inside here.
                   This allows the Body content to overlap the Header without being clipped.
                */}
                <div className="overflow-y-auto w-full h-full custom-scrollbar">
                    
                    {/* Header Background Image */}
                    <div className="h-40 bg-slate-100 relative w-full shrink-0">
                        {coverImage && (
                            <>
                                <img 
                                    src={coverImage} 
                                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110" 
                                    alt="Background"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                            </>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="px-8 pb-8">
                        
                        {/* STRUCTURAL FIX 5: 
                           Header Row (Cover + Text).
                           -mt-10 pulls it UP over the header div.
                           Since they are in the same scroll container, this renders correctly now.
                           z-10 ensures the text/cover sits ON TOP of the header background.
                        */}
                        <div className="relative -mt-10 mb-8 flex items-end gap-6 z-10">
                            {/* Cover Image */}
                            <div className="w-28 aspect-[2/3] shrink-0 bg-white rounded-xl shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center relative">
                                {coverImage ? (
                                    <img src={coverImage} className="w-full h-full object-cover" alt="Cover" /> 
                                ) : (
                                    <BookOpen size={32} className="text-slate-300" />
                                )}
                            </div>

                            {/* Title & Author */}
                            <div className="flex-1 min-w-0 pb-1 text-left">
                                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">{book.title}</h2>
                                <p className="text-slate-500 font-bold text-lg">{book.author}</p>
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
                                        <Library size={18} strokeWidth={2.5} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">Owned</span>
                                    </button>
                                    <button 
                                        onClick={() => onUpdateStatus(String(book.id), 'borrowed')}
                                        className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${!isOwned ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Clock size={18} strokeWidth={2.5} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">Borrowed</span>
                                    </button>
                               </div>
                            </div>
                        </div>

                        {/* Chapter book: start → finish tracking */}
                        {(onStartReading || activeReading) && (
                            <div className="mb-6">
                                {activeReading ? (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-1 text-amber-700 font-bold text-sm">
                                            <BookMarked size={16} /> Currently reading{activeReader ? ` · ${activeReader}` : ''}
                                        </div>
                                        <p className="text-xs text-slate-600 mb-3">
                                            Started {activeReading.started_at ? new Date(activeReading.started_at).toLocaleDateString() : ''} · day {daysBetween(activeReading.started_at, new Date().toISOString())}
                                        </p>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="date"
                                                value={finishDate}
                                                min={isoToDateInput(activeReading.started_at)}
                                                max={isoToDateInput(new Date().toISOString())}
                                                onChange={(e) => setFinishDate(e.target.value)}
                                                className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => finishDate && onFinishReading?.(activeReading.id, dateInputToIso(finishDate))}
                                                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition-transform"
                                            >
                                                Finish
                                            </button>
                                        </div>
                                        <button onClick={() => onCancelReading?.(activeReading.id)} className="mt-2 text-xs font-bold text-slate-400 hover:text-rose-500">
                                            Cancel tracking
                                        </button>
                                    </div>
                                ) : showStart ? (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Start date</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="date"
                                                value={startDate}
                                                max={isoToDateInput(new Date().toISOString())}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => { if (startDate && onStartReading) { onStartReading({ title: book.title, author: book.author }, dateInputToIso(startDate)); setShowStart(false); } }}
                                                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition-transform"
                                            >
                                                Start
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowStart(true)} className="w-full py-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
                                        <BookMarked size={16} /> Start as chapter book
                                    </button>
                                )}
                            </div>
                        )}

                        {/* STARS */}
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
                                {book.inWishlist ? 'Remove from Wish List' : 'Add to Wish List'}
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

                        {/* Shelves */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                                <Tag size={14} />
                                Shelves
                            </label>
                            {shelves.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {shelves.map(s => (
                                        <span key={s} className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold rounded-full pl-3 pr-2 py-1.5">
                                            {s}
                                            <button onClick={() => removeShelf(s)} className="hover:text-rose-300" aria-label={`Remove ${s}`}>
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newShelf}
                                    onChange={(e) => setNewShelf(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addShelf(newShelf); } }}
                                    placeholder="Add a shelf, e.g. Bedtime"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all"
                                />
                                <button onClick={() => addShelf(newShelf)} disabled={!newShelf.trim()} className="px-4 rounded-xl bg-slate-900 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
                                    Add
                                </button>
                            </div>
                            {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {suggestions.map(s => (
                                        <button key={s} onClick={() => addShelf(s)} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-full px-3 py-1.5 hover:border-slate-400 hover:text-slate-700 transition-colors">
                                            <Plus size={12} strokeWidth={3} /> {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* History */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                                <Calendar size={14} />
                                Reading History
                            </label>
                            
                            <div className="space-y-3">
                                {history.length > 0 ? (
                                    history.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                    {log.reader?.charAt(0) || 'R'}
                                                </div>
                                                <div>
                                                    <input
                                                        type="date"
                                                        value={isoToDateInput(log.timestamp)}
                                                        max={isoToDateInput(new Date().toISOString())}
                                                        onChange={(e) => e.target.value && onUpdateLogDate(log.id, dateInputToIso(e.target.value))}
                                                        className="text-sm font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
                                                        aria-label="Date read"
                                                    />
                                                    {log.started_at && (
                                                        <p className="text-[11px] font-bold text-amber-600">Read over {daysBetween(log.started_at, log.timestamp)} days</p>
                                                    )}
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
                        
                        {/* Actions */}
                        <div className="mt-8 space-y-4">
                            <button onClick={() => onReadAgain(book)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <Plus size={20} strokeWidth={3} />
                                Log Another Read
                            </button>
                            
                            <button onClick={() => { onDeleteAsset(book.title); onClose(); }} className="w-full text-red-400 text-xs font-bold hover:text-red-600 flex items-center justify-center gap-2 py-2 transition-colors">
                                <Trash2 size={14} /> Delete Book Asset
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
