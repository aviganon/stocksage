'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useI18n } from '@/lib/i18n/context';

interface Msg { role: 'user' | 'assistant'; content: string }

export function ReportChat({ reportId }: { reportId: string }) {
  const { getIdToken } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput('');
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/research/${reportId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await res.json();
      const answer = data.ok ? data.answer : (data.error?.message ?? t('common.error'));
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('common.error') }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [t('rv.askQ1'), t('rv.askQ2'), t('rv.askQ3')];

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💬</span>
        <h2 className="text-white font-semibold">{t('rv.askTitle')}</h2>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600/30 text-white border border-indigo-500/30'
                  : 'bg-white/8 text-gray-200 border border-white/10'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/8 text-gray-500 border border-white/10 rounded-2xl px-4 py-2.5 text-sm animate-pulse">
                {t('rv.askThinking')}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Suggested questions (only before first message) */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button key={s} onClick={() => ask(s)}
              className="text-xs bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('rv.askPlaceholder')}
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors disabled:opacity-50"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="btn-glow text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          {t('rv.askSend')}
        </button>
      </form>

      <p className="text-xs text-gray-600 mt-3">{t('rv.askDisclaimer')}</p>
    </div>
  );
}
