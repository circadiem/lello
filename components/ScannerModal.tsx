'use client';

import React, { useState } from 'react';
import { useZxing } from 'react-zxing';
import { X, Camera, AlertCircle } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (isbn: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onDetected }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onDetected(result.getText());
    },
    onError(err) {
      // Ignore frame errors, but log if permission denied
      if (err.name === 'NotAllowedError') {
          setError("Camera permission denied. Please enable it in settings.");
      }
    },
    constraints: {
      video: {
        facingMode: 'environment'
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-black rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
            <span className="text-white font-bold flex items-center gap-2 text-lg drop-shadow-md">
                <Camera size={24} /> Scan ISBN
            </span>
            <button 
                onClick={onClose} 
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95"
            >
                <X size={24} />
            </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-[3/4] bg-slate-900 flex items-center justify-center overflow-hidden">
            {/* FIX: Added autoPlay, playsInline, muted for iOS support */}
            <video 
                ref={ref} 
                className="w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted 
            />
            
            {/* Guide Box Overlay */}
            <div className="absolute inset-0 border-[50px] border-black/50 z-10 pointer-events-none">
                <div className="w-full h-full border-2 border-white/50 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1" />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-30 bg-black/80">
                    <div className="text-red-400 font-bold flex flex-col items-center gap-2">
                        <AlertCircle size={32} />
                        <p>{error}</p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-900 text-center">
            <p className="text-slate-400 font-medium">Point your camera at the barcode on the back of the book.</p>
        </div>
      </div>
    </div>
  );
}
