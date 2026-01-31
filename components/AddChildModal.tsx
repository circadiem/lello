'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, avatar: string | null) => void; // Updated signature
  existingNames: string[];
}

const AVATAR_OPTIONS = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];

export default function AddChildModal({ isOpen, onClose, onAdd, existingNames }: AddChildModalProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Reset when opening
  useEffect(() => {
    if(isOpen) {
        setName('');
        setSelectedAvatar(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !existingNames.includes(name.trim())) {
      onAdd(name.trim(), selectedAvatar);
      onClose();
    } else {
        alert("Name required or already exists.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900">New Reader</h2>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-2">Name</label>
                <input 
                    autoFocus
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-lg font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                    placeholder="e.g. Leo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">Choose Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                    {AVATAR_OPTIONS.map((fileName) => (
                        <button 
                            key={fileName}
                            type="button" 
                            onClick={() => setSelectedAvatar(fileName)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedAvatar === fileName ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-100 hover:border-slate-300'}`}
                        >
                            <img src={`/avatars/${fileName}`} className="w-full h-full object-cover" />
                            {selectedAvatar === fileName && (
                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={4} /></div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                <UserPlus size={20} />
                <span>Create Profile</span>
            </button>
        </form>
      </div>
    </div>
  );
}
