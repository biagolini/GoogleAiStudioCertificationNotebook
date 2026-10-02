import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  altText?: string;
  caption?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({
  imageUrl,
  altText = 'Question Diagram',
  caption,
  isOpen,
  onClose,
}: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-stone-200">{altText}</span>
            {caption && <span className="text-[11px] text-stone-400 truncate max-w-md">({caption})</span>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Close image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-stone-950/60">
          <img
            src={imageUrl}
            alt={altText}
            className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg border border-stone-800/80 select-none"
            loading="lazy"
          />
        </div>

        {/* Footer info */}
        {caption && (
          <div className="px-5 py-2.5 bg-stone-900/95 border-t border-stone-800 text-[11px] text-stone-400 text-center">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
