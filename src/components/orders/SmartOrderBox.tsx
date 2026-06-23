'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, Loader2, ClipboardPaste, X } from 'lucide-react';
import type { ParsedOrder } from '@/types';

interface SmartOrderBoxProps {
  onParsed: (data: ParsedOrder) => void;
  compact?: boolean;
}

export function SmartOrderBox({ onParsed, compact = false }: SmartOrderBoxProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Parse failed');
      onParsed(data);
      setText(''); // clear after success
    } catch (e: any) {
      setError(e.message ?? 'Failed to parse. Please enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setText(t);
    } catch {
      // Clipboard permission denied — user can type manually
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            // Ctrl+Enter to parse
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && text.trim()) {
              e.preventDefault();
              handleParse();
            }
          }}
          placeholder={
            compact
              ? 'Paste Facebook/Messenger message…'
              : `Paste customer message here…\n\nExample:\nNaam: Rahim\nPhone: 01712345678\nAddress: Chandpur Sadar\nProduct: Luxury Gift Box`
          }
          rows={compact ? 3 : 5}
          className="input font-mono text-xs leading-relaxed resize-none pr-8"
          disabled={loading}
        />
        {text && (
          <button
            onClick={() => { setText(''); setError(''); }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            aria-label="Clear"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handlePaste}
          disabled={loading}
          className="btn btn-outline btn-sm flex items-center gap-1.5"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Paste
        </button>
        <button
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className="btn-emerald flex-1 py-2 flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Parsing…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" />Parse with AI</>
          )}
        </button>
      </div>

      {!compact && (
        <p className="text-[10px] text-gray-400 text-center">
          Supports Bengali, English, and Banglish messages · Ctrl+Enter to parse
        </p>
      )}
    </div>
  );
}
