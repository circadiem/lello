'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Loader2, Camera } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (isbn: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onDetected }: ScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
        // Cleanup if closed
        if (scannerRef.current) {
            scannerRef.current.stop().catch(console.error);
            scannerRef.current = null;
        }
        return;
    }

    setInitializing(true);
    setError(null);

    // Initialize Scanner with a slight delay to ensure DOM is ready
    const timeout = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 150 }, // Rectangular box for barcodes
            aspectRatio: 1.0,
            formatsToSupport: [ Html5QrcodeSupportedFormats.EAN_13 ] // ISBNs are EAN-13
        };

        html5QrCode.start(
            { facingMode: "environment" }, // Use back camera
            config,
            (decodedText) => {
                // Success!
                html5QrCode.stop().then(() => {
                    onDetected(decodedText);
                }).catch(console.error);
            },
            (errorMessage) => {
                // scanning... (ignore errors while scanning)
            }
        ).then(() => {
            setInitializing(false);
        }).catch((err) => {
            setInitializing(false);
            setError("Could not access camera. Please allow permissions.");
            console.error(err);
        });
    }, 100);

    return () => {
        clearTimeout(timeout);
        if (scannerRef.current) {
            scannerRef.current.stop().catch(console.error);
        }
    };
  }, [isOpen, onDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-md bg-black rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-white font-bold flex items-center gap-2">
                <Camera size={20} /> Scan ISBN
            </span>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 backdrop-blur-md">
                <X size={20} />
            </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-[3/4] bg-slate-900 flex items-center justify-center overflow-hidden">
            <div id="reader" className="w-full h-full" />
            
            {/* Loading State */}
            {initializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <p className="text-red-400 font-bold">{error}</p>
                </div>
            )}
        </div>

        {/* Footer / Instructions */}
        <div className="p-6 bg-slate-900 text-center">
            <p className="text-slate-400 text-sm">Point your camera at the barcode on the back of the book.</p>
        </div>
      </div>
    </div>
  );
}
