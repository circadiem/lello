'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, Save } from 'lucide-react';

interface GoalAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'daily' | 'weekly';
  currentGoal: number;
  onSave: (newGoal: number) => void;
}

export default function GoalAdjustmentModal({ isOpen, onClose, type, currentGoal, onSave }: GoalAdjustmentModalProps) {
  const [value, setValue] = useState(currentGoal);

  // Reset value when modal opens or goal changes externally
  useEffect(() => {
    setValue(currentGoal);
  }, [currentGoal, isOpen]);

  if (!isOpen) return null;

  // Set reasonable max limits for the slider
  const maxVal = type === 'daily' ? 10 : 50;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
        
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={onClose} 
        />

        {/* Modal Card */}
        <div className="relative w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <Target size={16} />
                    <span>Adjust {type} Goal</span>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Value Display */}
            <div className="flex flex-col items-center mb-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-8xl font-mono-tabular font-extrabold text-slate-900 tracking-tighter">
                        {value}
                    </span>
                </div>
                <span className="text-slate-400 font-bold text-sm uppercase tracking-wide mt-2">
                    books per {type === 'daily' ? 'day' : 'week'}
                </span>
            </div>

            {/* Slider Input */}
            <div className="relative w-full h-12 flex items-center mb-8 px-2">
                <input
                    type="range"
                    min="1"
                    max={maxVal}
                    step="1"
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                />
            </div>

            {/* Save Button */}
            <button
                onClick={() => {
                    onSave(value);
                    onClose();
                }}
                className="w-full bg-slate-900 text-white font-bold h-14 rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                <Save size={20} strokeWidth={2.5} />
                Update Target
            </button>
        </div>
    </div>
  );
}
