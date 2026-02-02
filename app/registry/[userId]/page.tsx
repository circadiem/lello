'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, Gift, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Helper to generate Amazon Search Link
const getAmazonLink = (title: string, author: string) => {
    const query = encodeURIComponent(`${title} ${author}`);
    // Replace 'lello-20' with your future Associate Tag
    return `https://www.amazon.com/s?k=${query}&tag=lello-20`; 
};

export default function RegistryPage({ params }: { params: { userId: string } }) {
    const [books, setBooks] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Profile Name
            const { data: profileData } = await supabase
                .from('profiles')
                .select('readers')
                .eq('id', params.userId)
                .single();
            setProfile(profileData);

            // 2. Fetch Wishlist Books
            const { data: bookData } = await supabase
                .from('library')
                .select('*')
                .eq('user_id', params.userId)
                .eq('ownership_status', 'wishlist'); // Only show wishlist!
            
            if (bookData) setBooks(bookData);
            setLoading(false);
        };
        fetchData();
    }, [params.userId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300" /></div>;

    // Default to "Family" if no reader names found, or grab the first child's name
    const titleName = profile?.readers?.[0] ? `${profile.readers[0]}'s` : "Family";

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <Link href="/" className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors">
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Back to Lello</span>
                </Link>
                <div className="flex items-center gap-2">
                    <img src="/icon.png" className="w-8 h-8 rounded-lg" />
                    <span className="font-extrabold text-xl tracking-tight text-slate-900">Lello</span>
                </div>
                <div className="w-16" /> {/* Spacer for centering */}
            </div>

            {/* Hero */}
            <div className="max-w-2xl mx-auto px-6 pt-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold uppercase tracking-widest mb-6">
                    <Gift size={14} />
                    Official Book Registry
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    {titleName} Next Chapter
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    Help build their library. Choose a book below to spark a love for reading.
                </p>
            </div>

            {/* Book Grid */}
            <div className="max-w-xl mx-auto px-6 mt-12 space-y-4">
                {books.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-slate-400 font-bold">No books on the registry yet!</p>
                    </div>
                ) : (
                    books.map((book) => (
                        <div key={book.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-start sm:items-center gap-4 group hover:shadow-md transition-all">
                            {/* Cover */}
                            <div className="w-16 h-24 sm:w-20 sm:h-28 bg-slate-100 rounded-xl shrink-0 overflow-hidden shadow-inner flex items-center justify-center text-slate-300">
                                {book.cover_url ? <img src={book.cover_url} className="w-full h-full object-cover" /> : <BookOpen size={24} />}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{book.title}</h3>
                                <p className="text-sm font-medium text-slate-500 mb-4">{book.author}</p>
                                
                                {/* Buy Button */}
                                <a 
                                    href={getAmazonLink(book.title, book.author)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl text-sm transition-colors shadow-sm active:scale-95"
                                >
                                    <ShoppingBag size={16} />
                                    Buy on Amazon
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-16 text-center">
                <Link href="/" className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">
                    Powered by Lello
                </Link>
            </div>
        </div>
    );
}
