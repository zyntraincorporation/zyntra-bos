'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, Loader2, ClipboardPaste } from 'lucide-react';
import type { ParsedOrder } from '@/types';

interface SmartOrderBoxProps {
  onParsed: (data: ParsedOrder) => void;
}

export function SmartOrderBox({ onParsed }: SmartOrderBoxProps) {
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
    } catch (e: any) {
      setError(e.message ?? 'Failed to parse order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setText(t);
    } catch { }
  };

  return (
    <div className="stat-card border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Smart Order Box</p>
          <p className="text-[11px] text-gray-400">Paste a Messenger message → AI fills the form</p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`Paste customer message here…\n\nExample:\nName: Rahim\nPhone: 01712345678\nAddress: Chandpur Sadar\nProduct: Luxury Gift Box`}
        rows={5}
        className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder:text-gray-300 font-mono"
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ClipboardPaste className="w-3.5 h-3.5" /> Paste
        </button>
        <button
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className="flex-1 btn-emerald flex items-center justify-center gap-2 py-2 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing…</>
            : <><Sparkles className="w-4 h-4" /> Parse with AI</>}
        </button>
        {text && (
          <button onClick={() => setText('')} className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
