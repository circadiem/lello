'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { X, Loader2, ScanBarcode, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (isbn: string) => void;
}

// Book barcodes are EAN-13 starting 978/979 (Bookland). We also allow
// UPC-A as a fallback for some older US printings.
const BOOK_FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A];

function looksLikeIsbn(code: string): boolean {
  const digits = code.replace(/[^0-9]/g, '');
  if (digits.length === 13) return digits.startsWith('978') || digits.startsWith('979');
  if (digits.length === 12) return true; // UPC-A fallback
  return false;
}

export default function BarcodeScanner({ isOpen, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false); // guards against double-fire
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState('');

  // Always stop the camera. iOS keeps the stream (and the little green
  // light) on unless every track is explicitly stopped.
  const stopCamera = () => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* noop */
    }
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!isOpen) return;
    handledRef.current = false;
    setStatus('starting');
    setErrorMsg('');

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, BOOK_FORMATS);
    const reader = new BrowserMultiFormatReader(hints);

    let cancelled = false;

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } }, // prefer the back camera
          videoRef.current!,
          (result) => {
            if (handledRef.current || !result) return;
            const text = result.getText();
            if (!looksLikeIsbn(text)) return; // ignore non-book barcodes
            handledRef.current = true;
            const digits = text.replace(/[^0-9]/g, '');
            stopCamera();
            onDetected(digits);
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus('scanning');
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (err?.name === 'NotAllowedError') {
          setErrorMsg('Camera permission was denied. Enable it in your browser settings and try again.');
        } else if (err?.name === 'NotFoundError') {
          setErrorMsg('No camera was found on this device.');
        } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          setErrorMsg('The camera only works over HTTPS. Open the deployed (https) site rather than a local IP.');
        } else {
          setErrorMsg('Could not start the camera. Please try again.');
        }
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 text-white">
        <div className="flex items-center gap-2 font-bold">
          <ScanBarcode size={20} />
          <span>Scan a book</span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition"
          aria-label="Close scanner"
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Aiming frame */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[78%] max-w-sm aspect-[3/2] rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm font-medium text-white/80">Starting camera…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-amber-300">
              <AlertCircle size={28} />
            </div>
            <p className="text-white/90 text-sm font-medium leading-relaxed max-w-xs">{errorMsg}</p>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl active:scale-95 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Hint */}
      {status === 'scanning' && (
        <div className="px-6 py-6 text-center">
          <p className="text-white/70 text-sm font-medium">
            Point at the barcode on the back of the book.
          </p>
        </div>
      )}
    </div>
  );
}
