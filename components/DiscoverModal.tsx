'use client';

import React, { useState } from 'react';
import { Sparkles, X, Search, BookOpen, Plus, Gift, Check, Loader2, ArrowRight } from 'lucide-react';

interface Recommendation {
    title: string;
    author: string;
    reason: string;
    added?: boolean; // UI state
}

interface DiscoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBook: (title: string, author: string, status: 'owned' | 'wishlist') => void;
    userId: string;
}

export default function DiscoverModal({ isOpen, onClose, onAddBook, userId }: DiscoverModalProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Recommendation[]>([]);
    const [view, setView] = useState<'input' | 'results'>('input');

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults([]); // Clear previous
        
        try {
            const res = await fetch('/api/recommend', {
                method: 'POST',
                body: JSON.stringify({ query, userId })
            });
            const data = await res.json();
            
            if (data.success) {
                setResults(data.recommendations);
                setView('results');
            }
        } catch (e) {
            console.error(e);
            alert("The Librarian is taking a nap. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = (index: number, status: 'owned' | 'wishlist') => {
        const book = results[index];
        onAddBook(book.title, book.author, status);
        
        // Mark visually as added
        const newResults = [...results];
        newResults[index].added = true;
        setResults(newResults);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-slate-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">
                
                {/* Header */}
                <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
                            <Sparkles size={14} />
                        </div>
                        <span className="font-extrabold text-slate-900 tracking-tight">AI Librarian</span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {view === 'input' && (
                        <div className="space-y-6">
                            <div className="text-center py-6">
                                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">What are we reading next?</h2>
                                <p className="text-slate-500 font-medium text-sm">
                                    I analyze your <strong>Heavy Rotation</strong> to find books your kids will actually love.
                                </p>
                            </div>

                            <textarea 
                                autoFocus
                                className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                                placeholder="e.g. 'Funny books about space' or 'Books for a refined 5-year-old palette'"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />

                            <button 
                                disabled={loading || !query.trim()}
                                onClick={handleSearch}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                {loading ? 'Thinking...' : 'Get Recommendations'}
                            </button>
                        </div>
                    )}

                    {view === 'results' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Picks</p>
                                <button onClick={() => setView('input')} className="text-xs font-bold text-indigo-600 hover:underline">Ask again</button>
                            </div>

                            {results.map((book, i) => (
                                <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="mb-3">
                                        <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{book.title}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase">{book.author}</p>
                                    </div>
                                    
                                    <div className="p-3 bg-indigo-50/50 rounded-xl mb-4">
                                        <p className="text-xs font-medium text-indigo-900 leading-relaxed">
                                            <Sparkles size={10} className="inline mr-1 text-indigo-500" />
                                            {book.reason}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {book.added ? (
                                            <div className="w-full py-3 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                                                <Check size={14} /> Added
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => handleQuickAdd(i, 'owned')} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors">
                                                    + Library
                                                </button>
                                                <button onClick={() => handleQuickAdd(i, 'wishlist')} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1">
                                                    <Gift size={14} /> Wishlist
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
