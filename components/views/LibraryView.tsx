'use client';

import React, { useState } from 'react';
import { Share2, Check, BookOpen, Star, StickyNote, Gift, ChevronRight } from 'lucide-react';
import { getLastName } from '@/lib/helpers';
import { OCCASIONS } from '@/lib/constants';
import type { Book } from '@/lib/types';

interface LibraryViewProps {
  library: Book[];
  uniqueShelves: string[];
  userId: string;
  onSelectBook: (item: any) => void;
  onUpdateOccasion: (id: string, occasion: string | null) => void;
}

export default function LibraryView({ library, uniqueShelves, userId, onSelectBook, onUpdateOccasion }: LibraryViewProps) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('owned');
    const [copied, setCopied] = useState(false);

    const handleShareRegistry = () => {
        const url = `${window.location.origin}/registry/${userId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filters = [
        { id: 'owned', label: 'Library' },
        { id: 'wishlist', label: 'Wish List' },
        { id: 'borrowed', label: 'Borrowed' },
        ...uniqueShelves.map(s => ({ id: s, label: s }))
    ];

    // Filter Logic
    const filteredBooks: Book[] = library.filter(book => {
        const safeTitle = (book.title || '').toLowerCase();
        const safeAuthor = (book.author || '').toLowerCase();
        const searchLower = search.toLowerCase();
        const matchesSearch = safeTitle.includes(searchLower) || safeAuthor.includes(searchLower);
        let matchesFilter = false;

        if (filter === 'owned') matchesFilter = book.ownership_status === 'owned' || (!book.ownership_status && !book.in_wishlist);
        else if (filter === 'borrowed') matchesFilter = book.ownership_status === 'borrowed';
        else if (filter === 'wishlist') matchesFilter = book.in_wishlist === true;
        else matchesFilter = book.shelves?.includes(filter) || false;

        return matchesSearch && matchesFilter;
    }).sort((a, b) => (getLastName(a.author || '').localeCompare(getLastName(b.author || ''))));

    // Grouping
    const groupedBooks = filteredBooks.reduce((groups, book) => {
        const lastName = getLastName(book.author || 'Unknown');
        const letter = lastName.charAt(0).toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(book);
        return groups;
    }, {} as Record<string, Book[]>);

    const sortedKeys = Object.keys(groupedBooks).sort();

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
            <div className="flex justify-between items-center pt-4 mb-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Library</h1>
                {filter === 'wishlist' && (
                    <button
                        onClick={handleShareRegistry}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 active:scale-95 transition-all"
                    >
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        {copied ? 'Copied!' : 'Share'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            filter === f.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <input type="text" placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-4 py-4 mb-4" value={search} onChange={(e) => setSearch(e.target.value)} />

            <div className="space-y-8">
                {sortedKeys.map(letter => (
                    <div key={letter}>
                        <h2 className="text-sm font-extrabold text-slate-400 mb-4 px-2 sticky top-20">{letter}</h2>
                        <div className="space-y-3">
                            {groupedBooks[letter].map((book: Book) => (
                              <div key={book.id || `temp-${book.title}`}>
                                <button
                                    onClick={() => onSelectBook({ ...book, cover: book.cover_url || undefined, ownershipStatus: book.ownership_status, shelves: book.shelves, inWishlist: book.in_wishlist, rating: book.rating, memo: book.memo || undefined })}
                                    className="w-full bg-white p-3 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4 text-left group active:scale-[0.99] transition-transform"
                                >
                                    <div className="w-12 h-16 shrink-0 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-slate-300">
                                        {book.cover_url ? <img src={book.cover_url} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 truncate">{book.title}</p>
                                            {/* Rating Stars (Mini) */}
                                            {book.rating > 0 && (
                                                <div className="flex">
                                                    {[...Array(book.rating)].map((_, i) => (
                                                        <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                                                    ))}
                                                </div>
                                            )}
                                            {/* Tag Badges */}
                                            {book.shelves && book.shelves.length > 0 && (
                                                <div className="flex -space-x-1">
                                                    {book.shelves.slice(0,2).map(s => (
                                                        <div key={s} className="w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-white" />
                                                    ))}
                                                </div>
                                            )}
                                            {filter === 'all' && book.ownership_status === 'borrowed' && (<div className="px-1.5 py-0.5 bg-indigo-100 rounded-md"><StickyNote size={10} className="text-indigo-600" /></div>)}
                                            {(filter === 'all' || filter === 'wishlist') && book.in_wishlist && (<div className="px-1.5 py-0.5 bg-orange-100 rounded-md"><Gift size={10} className="text-orange-600" /></div>)}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium truncate">{book.author}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-200 group-hover:text-slate-400" />
                                </button>

                                {/* Wishlist meta: gift status + occasion picker */}
                                {filter === 'wishlist' && book.in_wishlist && (
                                    <div className="flex items-center gap-2 px-3 pt-2 flex-wrap">
                                        {book.purchased_at ? (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                🎁 Purchased{book.purchased_by ? ` by ${book.purchased_by}` : ''}
                                            </span>
                                        ) : (
                                            OCCASIONS.map(o => (
                                                <button
                                                    key={o}
                                                    onClick={() => onUpdateOccasion(book.id, book.occasion === o ? null : o)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                        book.occasion === o
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-slate-400 border-slate-200'
                                                    }`}
                                                >
                                                    {o}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                              </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
