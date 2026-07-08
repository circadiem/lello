'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowRight, Check, Loader2, Users, Home } from 'lucide-react';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const AVATARS = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];

export default function OnboardingWizard({ userId, onComplete }: OnboardingProps) {
  // 'fork' → choose new family vs join; 'create' → the 2-step setup; 'join' → invite code.
  const [view, setView] = useState<'fork' | 'create' | 'join'>('fork');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Join State
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setJoinError('');
    const { data, error } = await supabase.rpc('join_household', { invite_code: inviteCode.trim() });
    setLoading(false);
    if (error) { setJoinError('Something went wrong. Please try again.'); return; }
    if (data === true) { onComplete(); }
    else { setJoinError('That code is invalid or expired.'); }
  };

  // Parent State
  const [parentName, setParentName] = useState('Parents');
  const [parentAvatar, setParentAvatar] = useState<string | null>(null);

  // Child State
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    
    // 1. Construct the data
    // Parent goes LAST in the list so they appear at the end of the toggle
    const readers = [childName, parentName];
    
    const avatars: Record<string, string> = {};
    if (parentAvatar) avatars[parentName] = parentAvatar;
    if (childAvatar) avatars[childName] = childAvatar;

    const goals = {
        [childName]: { daily: 3, weekly: 15 } // Default goals
    };

    // 2. Save to Supabase
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        readers,
        avatars,
        goals
    });

    if (error) {
        alert("Error saving profile: " + error.message);
        setLoading(false);
    } else {
        // 3. Trigger reload in parent component
        onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md">

        {/* Fork: new family vs join a partner's household */}
        {view === 'fork' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center">
                    <h1 className="text-2xl font-extrabold text-slate-900">Welcome to Lello!</h1>
                    <p className="text-slate-500 mt-2 font-medium">Are you starting fresh, or joining your partner?</p>
                </div>
                <button onClick={() => setView('create')} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-left flex items-center gap-4 hover:border-slate-900 transition-colors active:scale-[0.99]">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Home size={20} /></div>
                    <div><p className="font-bold text-slate-900">Set up a new family</p><p className="text-xs text-slate-500 font-medium">Create your library from scratch.</p></div>
                </button>
                <button onClick={() => setView('join')} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-left flex items-center gap-4 hover:border-emerald-500 transition-colors active:scale-[0.99]">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0"><Users size={20} /></div>
                    <div><p className="font-bold text-slate-900">Join with an invite code</p><p className="text-xs text-slate-500 font-medium">Connect to your partner's library.</p></div>
                </button>
            </div>
        )}

        {/* Join a household by invite code */}
        {view === 'join' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div className="text-center">
                    <h1 className="text-2xl font-extrabold text-slate-900">Join a Family</h1>
                    <p className="text-slate-500 mt-2 font-medium">Enter the 6-character code your partner shared. This connects you to their library.</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Invite Code</label>
                    <input
                        autoFocus
                        type="text"
                        placeholder="e.g. 3F9A2B"
                        value={inviteCode}
                        onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setJoinError(''); }}
                        maxLength={6}
                        className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 font-bold text-slate-900 tracking-[0.3em] text-center uppercase focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    {joinError && <p className="text-rose-500 text-xs font-bold mt-2 pl-2">{joinError}</p>}
                </div>
                <button
                    onClick={handleJoin}
                    disabled={inviteCode.trim().length < 6 || loading}
                    className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Join Family <ArrowRight size={18} /></>}
                </button>
                <button onClick={() => { setView('fork'); setJoinError(''); }} className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600">Back</button>
            </div>
        )}

        {view === 'create' && (<>
        {/* Progress Dots */}
        <div className="flex gap-2 mb-8 justify-center">
            <div className={`h-2 w-8 rounded-full transition-colors ${step === 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className={`h-2 w-8 rounded-full transition-colors ${step === 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="text-center">
                        <h1 className="text-2xl font-extrabold text-slate-900">Welcome to Lello!</h1>
                        <p className="text-slate-500 mt-2 font-medium">First, let's set up the <b>Admin</b> profile (you).</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Parent Name</label>
                        <input 
                            type="text" 
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Choose Your Avatar</label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATARS.map(av => (
                                <button key={av} onClick={() => setParentAvatar(av)} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${parentAvatar === av ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-slate-100 hover:border-slate-300'}`}>
                                    <img src={`/avatars/${av}`} className="w-full h-full object-cover" />
                                    {parentAvatar === av && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><Check size={16} className="text-white bg-emerald-500 rounded-full p-0.5" strokeWidth={4} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                        Next Step <ArrowRight size={18} />
                    </button>
                    <button onClick={() => setView('fork')} className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600">Back</button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="text-center">
                        <h1 className="text-2xl font-extrabold text-slate-900">Add a Reader</h1>
                        <p className="text-slate-500 mt-2 font-medium">Who is the first reader we are tracking?</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Child Name</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="e.g. Leo"
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Choose Their Avatar</label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATARS.map(av => (
                                <button key={av} onClick={() => setChildAvatar(av)} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${childAvatar === av ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-slate-100 hover:border-slate-300'}`}>
                                    <img src={`/avatars/${av}`} className="w-full h-full object-cover" />
                                    {childAvatar === av && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><Check size={16} className="text-white bg-emerald-500 rounded-full p-0.5" strokeWidth={4} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={!childName || loading}
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Finish Setup'} 
                        {!loading && <Check size={18} />}
                    </button>
                    
                    <button onClick={() => setStep(1)} className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600">Back</button>
                </div>
            )}
        </div>
        </>)}
      </div>
    </div>
  );
}
