'use client';

import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatar: string) => void;
  currentAvatar: string | null;
  name: string;
}

// We assume you named your files 1.png through 6.png
const AVATAR_OPTIONS = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];

export default function AvatarModal({ isOpen, onClose, onSave, currentAvatar, name }: AvatarModalProps) {
  const [selected, setSelected] = useState<string | null>(currentAvatar);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-slate-900">Edit {name}</h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-4">
            {AVATAR_OPTIONS.map((fileName) => (
                <button 
                    key={fileName} 
                    onClick={() => setSelected(fileName)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selected === fileName ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-slate-100 hover:border-slate-300'}`}
                >
                    <img src={`/avatars/${fileName}`} className="w-full h-full object-cover" alt="avatar" />
                    {selected === fileName && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <div className="bg-emerald-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>
                        </div>
                    )}
                </button>
            ))}
             {/* Option to clear/reset to default if needed */}
             <button 
                onClick={() => setSelected(null)} 
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center gap-1 transition-all ${selected === null ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}
            >
                <User size={24} />
                <span className="text-[10px] font-bold uppercase">Default</span>
            </button>
        </div>

        <div className="p-6 bg-slate-50">
            <button 
                onClick={() => { if(selected) onSave(selected); onClose(); }} 
                disabled={!selected && selected !== null}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
            >
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
}
