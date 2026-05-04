'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, Landmark, Share2, Video } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
  'Hukum pakai inai untuk lelaki?',
  'Cara mandi wajib yang betul?',
  'Zakat simpanan bank?',
  'Hukum solat jumaat semasa musafir?',
];

const CHATGPT_URL =
  process.env.NEXT_PUBLIC_CHATGPT_URL ??
  'https://chatgpt.com/g/g-67f359db82ec81919978e7b851ecbdb3-ustazbot';

function trackEvent(event: string, payload: Record<string, unknown> = {}): void {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }),
  }).catch(() => {
    // silent — fire-and-forget
  });
}

export default function HomePage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length < 5) {
      setError('Sila masukkan soalan terlebih dahulu');
      return;
    }
    setError('');
    router.push(`/answer?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[480px] flex flex-col gap-8">

        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-3xl font-bold text-emerald-600">UstazBot</h1>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            Jawapan ringkas dan tersusun untuk persoalan agama anda
          </p>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-3">
          <textarea
            className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 placeholder-gray-400 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            rows={4}
            placeholder="Tulis soalan anda di sini..."
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          {error && <p className="text-red-500 text-sm px-1">{error}</p>}
          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            <Send size={18} />
            Tanya Sekarang
          </button>
        </div>

        {/* Example question chips */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Contoh Soalan
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  setError('');
                }}
                className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:border-emerald-500 hover:text-emerald-700 transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explore</p>
          <a
            href={CHATGPT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_chatgpt')}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-emerald-300 transition-colors"
          >
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <Sparkles size={20} className="text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">UstazBot on ChatGPT</div>
              <div className="text-xs text-gray-500">Tanya terus di ChatGPT</div>
            </div>
          </a>
          <div
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-70 cursor-not-allowed"
          >
            <div className="bg-gray-100 p-2.5 rounded-xl">
              <Landmark size={20} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Umrah Guide</div>
              <div className="text-xs text-gray-500">Panduan lengkap umrah</div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
              Akan Datang
            </span>
          </div>
        </div>

        {/* Connect */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Connect</p>
          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/syahnas/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2.5 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-blue-300 transition-colors"
            >
              <Share2 size={18} className="text-blue-600 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </a>
            <a
              href="https://www.tiktok.com/@pakcikbuku.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2.5 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-gray-400 transition-colors"
            >
              <Video size={18} className="text-gray-800 shrink-0" />
              <span className="text-sm font-medium text-gray-700">TikTok</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-8 leading-relaxed">
          Setiap jawapan dijana berdasarkan skop dan arahan yang ditetapkan. Untuk isu kritikal,
          sila rujuk ulama atau pihak berkuasa agama.
        </p>

      </div>
    </main>
  );
}
