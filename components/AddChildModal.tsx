'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  existingNames: string[];
}

export default function AddChildModal({ isOpen, onClose, onAdd, existingNames }: AddChildModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
        setName('');
        setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    
    if (!trimmed) {
        setError("Please enter a name");
        return;
    }
    
    if (existingNames.includes(trimmed)) {
        setError("This name already exists");
        return;
    }

    onAdd(trimmed);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 m-4 animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900">
                    <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">New Profile</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-2">
                    Child's Name
                </label>
                <input 
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="e.g. Sam"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300"
                />
                {error && <p className="text-red-500 text-xs font-bold mt-2 pl-2 animate-pulse">{error}</p>}
            </div>

            {/* Avatar Preview (Visual Flair) */}
            {name.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
                        className="w-10 h-10 rounded-full bg-white shadow-sm"
                        alt="Preview"
                    />
                    <div className="flex-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Preview Avatar</p>
                        <p className="text-sm font-bold text-slate-900">{name}</p>
                    </div>
                </div>
            )}

            <button 
                type="submit"
                disabled={!name.trim()}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Check size={18} strokeWidth={3} />
                <span>Create Profile</span>
            </button>
        </form>

      </div>
    </div>
  );
}
