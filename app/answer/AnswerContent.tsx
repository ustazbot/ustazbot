'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, Copy, Sparkles, CheckCircle } from 'lucide-react';
import type { Answer } from '@/lib/types';

const CHATGPT_URL =
  process.env.NEXT_PUBLIC_CHATGPT_URL ??
  'https://chatgpt.com/g/g-67f359db82ec81919978e7b851ecbdb3-ustazbot';

const CONFIDENCE_CONFIG: Record<Answer['confidence'], { label: string; className: string }> = {
  high: { label: 'Tinggi', className: 'bg-emerald-100 text-emerald-700' },
  medium: { label: 'Sederhana', className: 'bg-amber-100 text-amber-700' },
  low: { label: 'Rendah', className: 'bg-red-100 text-red-700' },
};

const CLIENT_FALLBACK: Answer = {
  question_id: '',
  summary: 'Maaf, saya belum dapat memberikan jawapan yang meyakinkan untuk soalan ini.',
  explanation: 'Sila cuba semula atau rujuk ulama yang bertauliah.',
  dalil: '',
  note: '',
  source: '',
  confidence: 'low',
};

function trackEvent(event: string, payload: Record<string, unknown> = {}): void {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }),
  }).catch(() => {
    // silent — fire-and-forget
  });
}

function formatAnswerText(question: string, answer: Answer): string {
  const parts = [`Soalan: ${question}`, `Jawapan: ${answer.summary}`, answer.explanation];
  if (answer.dalil) parts.push(`Dalil: ${answer.dalil}`);
  if (answer.source) parts.push(`Sumber: ${answer.source}`);
  return parts.join('\n\n');
}

export default function AnswerContent() {
  const router = useRouter();
  const params = useSearchParams();
  const question = params.get('q') ?? '';

  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!question) {
      router.replace('/');
      return;
    }
    fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
      .then((res) => res.json() as Promise<Answer>)
      .then(setAnswer)
      .catch(() => setAnswer(CLIENT_FALLBACK))
      .finally(() => setLoading(false));
  }, [question, router]);

  async function handleCopy() {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(formatAnswerText(question, answer));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available (e.g. non-HTTPS)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Sedang mencari jawapan...</p>
      </div>
    );
  }

  if (!answer) return null;

  const conf = CONFIDENCE_CONFIG[answer.confidence] ?? CONFIDENCE_CONFIG.low;

  return (
    <div className="flex flex-col gap-4">

      {/* Question chip */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Soalan</p>
        <p className="text-gray-900 text-sm font-medium leading-relaxed">{question}</p>
      </div>

      {/* Answer card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-5">

        {/* Confidence badge */}
        <div className="flex justify-end">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${conf.className}`}>
            Keyakinan: {conf.label}
          </span>
        </div>

        {/* Summary */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Jawapan Ringkas
          </p>
          <p className="text-gray-900 font-semibold leading-relaxed">{answer.summary}</p>
        </div>

        {/* Explanation */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Huraian
          </p>
          <p className="text-gray-700 leading-relaxed text-sm">{answer.explanation}</p>
        </div>

        {/* Dalil — only shown if non-empty */}
        {answer.dalil && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Dalil
            </p>
            <p className="text-gray-700 text-sm leading-relaxed bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              {answer.dalil}
            </p>
          </div>
        )}

        {/* Nota Penting — only shown if non-empty */}
        {answer.note && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Nota Penting
            </p>
            <p className="text-gray-700 text-sm leading-relaxed bg-amber-50 rounded-xl p-3.5 border border-amber-100">
              {answer.note}
            </p>
          </div>
        )}

        {/* Sumber — only shown if non-empty */}
        {answer.source && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Sumber
            </p>
            <p className="text-gray-500 text-xs">{answer.source}</p>
          </div>
        )}

      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pb-8">
        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-full transition-colors"
        >
          <RotateCcw size={18} />
          Tanya Soalan Baru
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-full hover:border-gray-300 transition-colors text-sm"
          >
            {copied ? (
              <CheckCircle size={16} className="text-emerald-600" />
            ) : (
              <Copy size={16} />
            )}
            {copied ? 'Disalin!' : 'Salin Jawapan'}
          </button>
          <a
            href={CHATGPT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_chatgpt', { question_id: answer.question_id })}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-full hover:border-gray-300 transition-colors text-sm"
          >
            <Sparkles size={16} className="text-emerald-600" />
            Buka versi ChatGPT
          </a>
        </div>
      </div>

    </div>
  );
}
