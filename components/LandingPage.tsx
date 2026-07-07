'use client';

import React, { useState } from 'react';
import { Mail, ShieldCheck, Activity, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) setError(error.message);
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <img src="/icon.png" alt="Lello Logo" className="w-10 h-10 rounded-xl shadow-sm border border-slate-100" />
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">Lello</span>
                </div>
            </nav>
            <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Beta Access Open
                </div>
                <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                    Capture every chapter <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">of their childhood.</span>
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-10 max-w-xl leading-relaxed">
                    From their first picture book to their first novel. Track the journey, celebrate the milestones, and foster a love for learning.
                </p>
                <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex gap-4 mb-6 p-1 bg-slate-50 rounded-xl">
                        <button onClick={() => setIsSignUp(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Log In</button>
                        <button onClick={() => setIsSignUp(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Sign Up</button>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-3">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="email" placeholder="name@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="password" placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        </div>
                        {error && (<div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2"><Activity size={14} /> {error}</div>)}
                        <button disabled={loading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Welcome Back')}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
