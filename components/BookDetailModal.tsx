'use client';

import React, { useState } from 'react';
import { X, BookOpen, Trash2, House, Library, Gift, Plus, Clock, Tag } from 'lucide-react';

// Strict Types Preserved
interface DisplayItem {
  id: string | number;
  title: string;
  author: string;
  cover?: string;
  cover_url?: string | null;
  reader?: string;
  timestamp?: string;
  count?: number;
  ownershipStatus?: 'owned' | 'borrowed' | 'wishlist';
  shelves?: string[]; // NEW: Added shelves support
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
  onReadAgain: (book: DisplayItem) => void;
  onRemove: (id: string | number) => void; 
  onDeleteAsset: (title: string) => void; 
  onToggleStatus: (id: string | number, status: 'owned' | 'borrowed' | 'wishlist') => void;
  onUpdateShelves: (id: string | number, shelves: string[]) => void; // NEW: Callback
}

export default function BookDetailModal({ 
    book, 
    history, 
    onClose, 
    onReadAgain, 
    onRemove, 
    onDeleteAsset, 
    onToggleStatus,
    onUpdateShelves
}: BookDetailModalProps) {
  
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelf, setNewShelf] = useState('');

  if (!book) return null;

  const coverImage = book.cover || book.cover_url;
  const currentShelves = book.shelves || [];

  const handleDeleteLibraryBook = () => {
      if (confirm(`Delete "${book.title}" from your Library entirely? This cannot be undone.`)) {
          onDeleteAsset(book.title);
          onClose();
      }
  };

  const handleAddShelf = () => {
      if (!newShelf.trim()) {
          setIsAddingShelf(false);
          return;
      }
      const updated = [...currentShelves, newShelf.trim()];
      // Remove duplicates
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-[85vh] sm:h-auto bg-slate-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header Image */}
        <div className="relative h-64 bg-slate-200 shrink-0">
            {coverImage ? (
                <>
                    <img src={coverImage} className="w-full h-full object-cover blur-xl opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <img src={coverImage} className="h-full w-auto rounded-xl shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500" />
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookOpen size={64} />
                </div>
            )}
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white -mt-6 rounded-t-[2.5rem] relative p-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{book.title}</h2>
                <p className="text-slate-500 font-medium">{book.author}</p>
            </div>

            {/* Stats Grid with Ownership Toggle */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-1 text-center">
                    <span className="text-3xl font-extrabold text-slate-900">{book.count || history.length || 0}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Reads</span>
                </div>

                <div className="p-2 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                   <div className="flex bg-slate-200/50 p-1 rounded-2xl h-full relative">
                        <button 
                            onClick={() => onToggleStatus(book.id, 'owned')}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${book.ownershipStatus === 'owned' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <House size={18} strokeWidth={2.5} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Owned</span>
                        </button>
                        <button 
                            onClick={() => onToggleStatus(book.id, 'borrowed')}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${book.ownershipStatus === 'borrowed' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Library size={18} strokeWidth={2.5} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Borrowed</span>
                        </button>
                   </div>
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

            {/* Registry Button */}
            {book.ownershipStatus === 'borrowed' && (
                <button 
                    onClick={() => {
                        onToggleStatus(book.id, 'wishlist');
                        onClose();
                    }}
                    className="w-full mb-8 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                >
                    <Gift size={18} />
                    Add to Registry (Wishlist)
                </button>
            )}

            {/* Reading History */}
            <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Reading History</h3>
            <div className="space-y-4">
                {history.map((entry) => (
                    <div key={entry.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 items-start group">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold text-xs">
                           <Clock size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{entry.reader}</p>
                                    <p className="text-xs text-slate-400 font-medium">{new Date(entry.timestamp).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => onRemove(entry.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {entry.notes && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 italic border border-slate-100">
                                    "{entry.notes}"
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        Hasn't been read yet.
                    </div>
                )}
            </div>

            {/* Delete Book */}
            <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                <button onClick={handleDeleteLibraryBook} className="text-red-400 text-xs font-bold hover:text-red-600 transition-colors flex items-center justify-center gap-2 mx-auto">
                    <Trash2 size={14} /> Remove Book from Library
                </button>
            </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white border-t border-slate-100">
            <button onClick={() => onReadAgain(book)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus size={20} strokeWidth={3} />
                Log Another Read
            </button>
        </div>
      </div>
    </div>
  );
}
