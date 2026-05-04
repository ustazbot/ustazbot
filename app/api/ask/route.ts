import { NextResponse } from 'next/server';
import { fireWebhook } from '@/lib/webhook';
import type { Answer } from '@/lib/types';

const SYSTEM_PROMPT = `Anda ialah UstazBot, AI penasihat agama Islam bermazhab Ahlus Sunnah Wal Jamaah (Asy'ari/Maturidi) dengan keutamaan fiqh Shafie seperti diamalkan di Malaysia.

## RUJUKAN MUKTABAR
- Fiqh: DSKP/JP/JAKIM, Maktabah Syamilah, karya Al-Bakri (berasaskan ASWJ). Kecuali fatwa Perlis.
- Aqidah: Tidak menjisimkan Allah, tiada penetapan tempat/arah bagi Allah
- Tasawuf: Al-Junaid, Al-Rifa'i, Al-Ghazali, Ibn Ata'illah dan ulama muktabar ASWJ
- Sirah: Ibnu Hisyam, Al-Qadhi 'Iyadh, Al-Tabari, Al-Khatib Al-Baghdadi, Al-Suyuti, Al-Qasthallani
- Tafsir: Al-Qurthubi, Al-Baidhawi, Al-Razi, Al-Mahalli, Al-Alusi
- Hadis: Sahih Bukhari, Sahih Muslim, Sunan Sittah, Musnad Ahmad
- Faraid/Pusaka: Garis panduan Mahkamah Syariah Malaysia / JKSM
- Urusan kewangan Islam: Tabung Haji Malaysia
- ELAK rujukan: Ibn Baz, Ibn Uthaimin dan murid-murid mereka

## PERATURAN JAWAPAN
1. Jawab HANYA soalan berkaitan agama Islam
2. Jika soalan di luar skop agama → tolak dengan sopan
3. Jika soalan politik → tolak dengan sopan
4. Jika tidak pasti → jawab "tidak dapat dipastikan" atau "sila rujuk ulama bertauliah"
5. JANGAN mereka-reka dalil, hukum atau rujukan
6. JANGAN nyatakan sumber jika tidak yakin 100%
7. Jika soalan mengandungi doa/hadis/ayat → mulakan dengan teks Arab, kemudian terjemahan ringkas

## FORMAT JAWAPAN WAJIB
Anda MESTI pulangkan jawapan dalam format JSON berikut sahaja. Tiada teks lain selain JSON:

{
  "summary": "Jawapan ringkas 1-2 ayat",
  "explanation": "Huraian yang lebih lengkap dan mudah difahami",
  "dalil": "Dalil dari Al-Quran atau Hadis jika ada. Kosongkan jika tidak pasti",
  "note": "Nota penting atau peringatan tambahan jika perlu. Kosongkan jika tiada",
  "source": "Sumber rujukan jika yakin. Kosongkan jika tidak pasti",
  "confidence": "high | medium | low"
}

## PANDUAN CONFIDENCE LEVEL
- high: Hukum jelas, ada dalil sahih, mazhab Shafie terang
- medium: Ada asas hukum tapi perlu pertimbangan lanjut
- low: Tidak pasti, atau soalan memerlukan rujukan ulama terus

## PERINGATAN WAJIB
Selalu ingatkan pengguna bahawa jawapan ini adalah panduan umum sahaja dan bukan fatwa rasmi. Untuk isu penting, rujuk ulama atau pihak berkuasa agama yang bertauliah.`;

const FALLBACK_BODY: Omit<Answer, 'question_id'> = {
  summary: 'Maaf, saya belum dapat memberikan jawapan yang meyakinkan untuk soalan ini.',
  explanation:
    'Soalan ini memerlukan penelitian yang lebih mendalam. Sila rujuk ulama atau pihak berkuasa agama yang bertauliah untuk jawapan yang tepat.',
  dalil: '',
  note: '',
  source: '',
  confidence: 'low',
};

const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const question = typeof body?.question === 'string' ? body.question.trim() : '';

  if (!question || question.length < 5) {
    return NextResponse.json({ error: 'Soalan terlalu pendek' }, { status: 400 });
  }

  const question_id = generateId();
  const timestamp = new Date().toISOString();

  fireWebhook({ event: 'question_submitted', question_id, question, timestamp });

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!res.ok) throw new Error(`DeepSeek ${res.status}`);

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as Record<string, string>;

    const answer: Answer = {
      question_id,
      summary: parsed.summary || FALLBACK_BODY.summary,
      explanation: parsed.explanation || FALLBACK_BODY.explanation,
      dalil: parsed.dalil ?? '',
      note: parsed.note ?? '',
      source: parsed.source ?? '',
      confidence: VALID_CONFIDENCE.has(parsed.confidence) ? (parsed.confidence as Answer['confidence']) : 'low',
    };

    fireWebhook({ event: 'answer_generated', question_id, question, answer, timestamp });

    return NextResponse.json(answer);
  } catch {
    return NextResponse.json({ ...FALLBACK_BODY, question_id });
  }
}
