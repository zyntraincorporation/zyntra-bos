'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant'; content: string; error?: boolean };

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Hello! I am your AI Business Assistant. I can analyze your sales, inventory, and profit. What would you like to know?',
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    // Focus input on load
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.reply || 'Request failed');
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: e.message || 'Sorry, I encountered an error. Please try again.', error: true },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleClear = () => {
    if (confirm('Clear conversation history?')) {
      setMessages([INITIAL_MESSAGE]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--nav-height))] md:h-[calc(100dvh-var(--header-height))] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">AI Assistant</h2>
            <p className="text-[10px] text-gray-400">Powered by live business data</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3 max-w-[85%] animate-slide-up',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-emerald-100 text-emerald-700'
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={cn(
              'px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed',
              msg.role === 'user'
                ? 'bg-gray-800 text-white rounded-tr-sm'
                : msg.error
                  ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                  : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm'
            )}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="prose prose-sm prose-emerald max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce-dots [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce-dots [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce-dots"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 shrink-0 mb-[env(safe-area-inset-bottom)]">
        <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about sales, stock, or insights..."
            className="flex-1 bg-transparent border-none text-sm px-3 py-2 outline-none min-h-[40px]"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
