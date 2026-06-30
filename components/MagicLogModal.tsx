'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Mic, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface MagicLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  readers: string[];
  onLogged: (log: any) => void;
}

// Natural-language quick logging. The user types (or dictates) a sentence like
// "Leo read Goodnight Moon and loved it" and the /api/magic-log route uses
// Gemini to extract the book + reader + sentiment and insert the reading log.
export default function MagicLogModal({ isOpen, onClose, readers, onLogged }: MagicLogModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech API is optional — only show the mic where it exists.
  const speechSupported =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (isOpen) { setText(''); setError(''); setLoading(false); }
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      setListening(false);
    };
  }, [isOpen]);

  const toggleMic = () => {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      setText(prev => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Please log in again.'); setLoading(false); return; }

      const res = await fetch('/api/magic-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, readers }),
      });
      const data = await res.json();

      if (data.success && data.log) {
        onLogged(data.log);
        onClose();
      } else {
        setError(data.error || "Couldn't read that. Try naming the book and reader.");
      }
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Wand2 size={14} />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">Quick Log</span>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-slate-500 font-medium text-sm">
            Just describe it in words — I'll figure out the book and reader.
          </p>

          <div className="relative">
            <textarea
              autoFocus
              className="w-full h-28 bg-white border border-slate-200 rounded-2xl p-4 pr-12 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none shadow-sm"
              placeholder="e.g. 'Leo read Goodnight Moon twice and loved it'"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {speechSupported && (
              <button
                onClick={toggleMic}
                className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  listening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                aria-label="Dictate"
              >
                <Mic size={16} />
              </button>
            )}
          </div>

          {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

          <button
            disabled={loading || !text.trim()}
            onClick={handleSubmit}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {loading ? 'Logging…' : 'Log it'}
          </button>
        </div>
      </div>
    </div>
  );
}
