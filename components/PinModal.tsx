'use client';

import React, { useState, useEffect } from 'react';
import { X, Delete, Lock } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setPin('');
        setError(false);
    }
  }, [isOpen]);

  const handleNum = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      // Auto-submit on 4th digit
      if (newPin.length === 4) {
        if (newPin === '0000') {
           setTimeout(() => onSuccess(), 100);
        } else {
           setError(true);
           setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm p-8 flex flex-col items-center">
        
        <div className="mb-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-200">
                <Lock size={32} />
            </div>
            <h2 className="text-white text-xl font-bold">Parent Access</h2>
            <p className="text-slate-400 text-sm">Enter PIN to manage family settings</p>
        </div>

        {/* PIN Dots */}
        <div className="flex gap-6 mb-12">
            {[0, 1, 2, 3].map(i => (
                <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        pin.length > i 
                        ? error ? 'bg-red-500 scale-110' : 'bg-white scale-110' 
                        : 'bg-slate-700'
                    }`} 
                />
            ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                    key={num}
                    onClick={() => handleNum(num.toString())}
                    className="aspect-square rounded-full bg-slate-800/50 text-white text-2xl font-bold hover:bg-slate-700 active:scale-95 transition-all"
                >
                    {num}
                </button>
            ))}
            <button onClick={onClose} className="aspect-square flex items-center justify-center rounded-full text-slate-400 font-bold hover:text-white transition-colors">
                Cancel
            </button>
            <button
                onClick={() => handleNum('0')}
                className="aspect-square rounded-full bg-slate-800/50 text-white text-2xl font-bold hover:bg-slate-700 active:scale-95 transition-all"
            >
                0
            </button>
            <button onClick={handleDelete} className="aspect-square flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors active:scale-90">
                <Delete size={24} />
            </button>
        </div>

        {error && <p className="mt-8 text-red-500 font-bold animate-pulse">Incorrect PIN</p>}
      </div>
    </div>
  );
}
