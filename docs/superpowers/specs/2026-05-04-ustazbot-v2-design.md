# UstazBot v2 — Design Spec

**Date:** 2026-05-04  
**Status:** Approved

---

## Overview

UstazBot v2 is a stateless, single-question Islamic answer engine built with Next.js 14 (App Router). The user submits one question, receives one structured answer. No chat history, no session, no authentication.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (outline, monochrome only)
- **Font:** Inter (Google Fonts)
- **AI:** DeepSeek API (`deepseek-chat` model)
- **Webhooks:** Make.com (fire-and-forget)
- **Deployment:** Vercel

---

## Pages

### Homepage (`/`)

Mobile-first layout, max-width 480px centered, iPhone app feel.

- Top: small logo + "UstazBot" text (centered)
- Hero subtitle: "Jawapan ringkas dan tersusun untuk persoalan agama anda"
- Large textarea (placeholder: "Tulis soalan anda di sini...")
- Primary CTA button: "Tanya Sekarang" (emerald-600, rounded-full)
- Inline validation error: "Sila masukkan soalan terlebih dahulu" (shown if empty/< 5 chars on submit)
- Example question chips (clickable, populate textarea):
  - "Hukum pakai inai untuk lelaki?"
  - "Cara mandi wajib yang betul?"
  - "Zakat simpanan bank?"
  - "Hukum solat jumaat semasa musafir?"
- Explore section:
  - Card: "UstazBot on ChatGPT" → `NEXT_PUBLIC_CHATGPT_URL` (icon: Sparkles) — fires `click_chatgpt` webhook
  - Card: "Umrah Guide" → "Akan Datang" badge (icon: Landmark) — fires `click_umrah` webhook
- Connect section:
  - Facebook: `https://www.facebook.com/syahnas/` (icon: Share2)
  - TikTok: `https://www.tiktok.com/@pakcikbuku.com` (icon: Video)
- Footer: "Setiap jawapan dijana berdasarkan skop dan arahan yang ditetapkan. Untuk isu kritikal, sila rujuk ulama atau pihak berkuasa agama."

**Submit flow:** On valid submit → `router.push('/answer?q=' + encodeURIComponent(question))`

### Answer Page (`/answer?q=...`)

- Reads `q` param from URL using `useSearchParams()`
- On mount, calls `POST /api/ask` with `{ question }`
- Loading state: spinner + "Sedang mencari jawapan..." (button disabled)
- Displays structured answer card with sections:
  - **Soalan** — the user's question (gray chip at top)
  - **Jawapan Ringkas** — `summary` field
  - **Huraian** — `explanation` field
  - **Dalil** — shown only if non-empty
  - **Nota Penting** — shown only if non-empty
  - **Sumber** — shown only if non-empty
  - **Confidence badge** — `high` → emerald, `medium` → amber, `low` → red; labels: Tinggi / Sederhana / Rendah
- Action buttons:
  - "Tanya Soalan Baru" (RotateCcw icon) → `router.push('/')`
  - "Salin Jawapan" (Copy icon) → copies plain-text formatted answer to clipboard. Format: `Soalan: {question}\n\nJawapan: {summary}\n\n{explanation}\n\nDalil: {dalil}\n\nSumber: {source}`  (dalil/sumber lines omitted if empty)
  - "Buka versi ChatGPT" (Sparkles icon) → opens `NEXT_PUBLIC_CHATGPT_URL` in new tab
- Error handling: API error renders the fallback answer (not an error page)

---

## API Routes

### `POST /api/ask`

**Request:** `{ question: string }`

**Validation:**
- Empty string → 400
- Length < 5 chars → 400

**Processing:**
1. Generate `question_id = Date.now().toString(36) + Math.random().toString(36).slice(2)`
2. Fire `question_submitted` webhook (non-blocking)
3. Call DeepSeek `deepseek-chat` with system prompt + user question
4. Parse JSON response; on parse failure → return fallback
5. Fire `answer_generated` webhook (non-blocking)
6. Return structured answer + `question_id`

**Response shape:**
```json
{
  "question_id": "string",
  "summary": "string",
  "explanation": "string",
  "dalil": "string",
  "note": "string",
  "source": "string",
  "confidence": "high | medium | low"
}
```

**Fallback response (on any error):** `question_id` is always present (generated before the DeepSeek call).
```json
{
  "question_id": "<generated>",
  "summary": "Maaf, saya belum dapat memberikan jawapan yang meyakinkan untuk soalan ini.",
  "explanation": "Soalan ini memerlukan penelitian yang lebih mendalam. Sila rujuk ulama atau pihak berkuasa agama yang bertauliah untuk jawapan yang tepat.",
  "dalil": "",
  "note": "",
  "source": "",
  "confidence": "low"
}
```

### `POST /api/track`

Lightweight client-side event tracking route.

**Request:** `{ event: "click_chatgpt" | "click_umrah", question_id?: string, timestamp: string }`

Fires corresponding Make.com webhook (non-blocking), returns `{ ok: true }`.

---

## DeepSeek System Prompt

```
Anda ialah UstazBot, AI penasihat agama Islam bermazhab Ahlus Sunnah Wal Jamaah (Asy'ari/Maturidi) dengan keutamaan fiqh Shafie seperti diamalkan di Malaysia.

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
Selalu ingatkan pengguna bahawa jawapan ini adalah panduan umum sahaja dan bukan fatwa rasmi. Untuk isu penting, rujuk ulama atau pihak berkuasa agama yang bertauliah.
```

---

## Webhook Events (Make.com)

All webhooks POST to `process.env.MAKE_WEBHOOK_URL`. Fire-and-forget — no `await`, wrapped in `try/catch`.

| Event | When | Payload |
|---|---|---|
| `question_submitted` | Before DeepSeek call | `{ event, question_id, question, timestamp }` |
| `answer_generated` | After successful parse | `{ event, question_id, question, answer, timestamp }` |
| `click_chatgpt` | User clicks ChatGPT link | `{ event, question_id?, timestamp }` |
| `click_umrah` | User clicks Umrah card | `{ event, timestamp }` |

---

## Shared Types (`lib/types.ts`)

```typescript
export interface Answer {
  question_id: string;
  summary: string;
  explanation: string;
  dalil: string;
  note: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}
```

---

## Webhook Helper (`lib/webhook.ts`)

```typescript
export function fireWebhook(payload: Record<string, unknown>): void {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) return;
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* silent */ }
}
```

---

## Design System

| Token | Value |
|---|---|
| Primary | `emerald-600` |
| Background | `gray-50` |
| Card | `white` + `shadow-sm` |
| Heading text | `gray-900` |
| Body text | `gray-600` |
| Border radius (cards) | `rounded-2xl` |
| Border radius (buttons/chips) | `rounded-full` |
| Max width | `480px` centered |
| Font | Inter (Google Fonts) |

No dark gradients. No chat bubbles. Mobile-first.

---

## Environment Variables

```
DEEPSEEK_API_KEY=
MAKE_WEBHOOK_URL=
NEXT_PUBLIC_CHATGPT_URL=https://chatgpt.com/g/g-67f359db82ec81919978e7b851ecbdb3-ustazbot
```

---

## Additional Requirements

- `robots.txt`: allow all
- Basic SEO meta tags in `layout.tsx`
- `question_id` format: `Date.now().toString(36) + Math.random().toString(36).slice(2)`
- Stateless: no localStorage, no cookies, no server-side session
- Each page visit is independent

---

## Out of Scope (v2)

- Rate limiting (add via Vercel middleware later)
- Analytics beyond Make.com webhooks
- Internationalisation (Malay only, hardcoded)
- Dark mode
- PWA / service worker
