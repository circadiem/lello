'use client';

import React, { useState, useEffect } from 'react';
import { Delete, Lock, ShieldPlus } from 'lucide-react';
import { hashPin, generateSalt, PinRecord } from '@/lib/pin';

interface PinModalProps {
  isOpen: boolean;
  mode: 'set' | 'verify';
  pinRecord?: PinRecord | null; // required for verify mode
  onClose: () => void;
  onVerified?: () => void;
  onSet?: (hash: string, salt: string) => void;
  onForgot?: () => void;
}

export default function PinModal({
  isOpen,
  mode,
  pinRecord,
  onClose,
  onVerified,
  onSet,
  onForgot,
}: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  // In set mode we collect the PIN twice: 'enter' then 'confirm'.
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [firstEntry, setFirstEntry] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset internal state whenever the modal opens or its mode changes
  // (e.g. a "Forgot PIN?" reset flips us from verify → set).
  useEffect(() => {
    setPin('');
    setError(false);
    setStage('enter');
    setFirstEntry('');
    setBusy(false);
  }, [isOpen, mode]);

  const handleNum = async (num: string) => {
    if (busy || pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    setError(false);
    if (newPin.length < 4) return;

    // 4th digit entered — act on the completed PIN.
    if (mode === 'verify') {
      setBusy(true);
      const hash = await hashPin(newPin, pinRecord?.salt || '');
      if (hash === pinRecord?.hash) {
        setTimeout(() => onVerified?.(), 100);
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setBusy(false); }, 500);
      }
      return;
    }

    // mode === 'set'
    if (stage === 'enter') {
      setFirstEntry(newPin);
      setTimeout(() => { setStage('confirm'); setPin(''); }, 150);
      return;
    }

    // stage === 'confirm'
    if (newPin === firstEntry) {
      setBusy(true);
      const salt = generateSalt();
      const hash = await hashPin(newPin, salt);
      setTimeout(() => onSet?.(hash, salt), 100);
    } else {
      setError(true);
      setTimeout(() => { setPin(''); setFirstEntry(''); setStage('enter'); }, 600);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (!isOpen) return null;

  const isSet = mode === 'set';
  const heading = isSet ? (stage === 'enter' ? 'Create a PIN' : 'Confirm your PIN') : 'Parent Access';
  const subtitle = isSet
    ? (stage === 'enter' ? 'Set a 4-digit PIN to protect parent settings' : 'Re-enter your PIN to confirm')
    : 'Enter PIN to manage family settings';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm p-8 flex flex-col items-center">

        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-200">
            {isSet ? <ShieldPlus size={32} /> : <Lock size={32} />}
          </div>
          <h2 className="text-white text-xl font-bold">{heading}</h2>
          <p className="text-slate-400 text-sm text-center">{subtitle}</p>
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

        {error && (
          <p className="mt-8 text-red-500 font-bold animate-pulse">
            {isSet ? "PINs didn't match" : 'Incorrect PIN'}
          </p>
        )}

        {mode === 'verify' && onForgot && !error && (
          <button onClick={onForgot} className="mt-8 text-slate-400 text-sm font-bold hover:text-white transition-colors">
            Forgot PIN?
          </button>
        )}
      </div>
    </div>
  );
}
