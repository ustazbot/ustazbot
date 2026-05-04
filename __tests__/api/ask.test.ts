/**
 * @jest-environment node
 */

import { POST } from '@/app/api/ask/route';

const VALID_QUESTION = 'Hukum makan babi dalam Islam?';

const MOCK_DEEPSEEK_ANSWER = {
  summary: 'Haram dimakan',
  explanation: 'Babi adalah haram berdasarkan nas Al-Quran yang jelas.',
  dalil: 'Surah Al-Baqarah: 173',
  note: '',
  source: 'Fiqh Manhaji',
  confidence: 'high',
};

describe('POST /api/ask', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('deepseek')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(MOCK_DEEPSEEK_ANSWER) } }],
          }),
        });
      }
      return Promise.resolve({ ok: true }); // webhook calls
    });
    global.fetch = fetchMock as typeof fetch;
    process.env.DEEPSEEK_API_KEY = 'test-key';
    process.env.MAKE_WEBHOOK_URL = '';
  });

  it('returns 400 for empty question', async () => {
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for question shorter than 5 chars', async () => {
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'abc' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for whitespace-only question', async () => {
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '   ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns structured answer with question_id for valid question', async () => {
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: VALID_QUESTION }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.question_id).toBeDefined();
    expect(typeof data.question_id).toBe('string');
    expect(data.summary).toBe('Haram dimakan');
    expect(data.confidence).toBe('high');
    expect(data.dalil).toBe('Surah Al-Baqarah: 173');
  });

  it('returns fallback answer when DeepSeek returns non-ok status', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('deepseek')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true });
    });
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: VALID_QUESTION }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.confidence).toBe('low');
    expect(data.summary).toContain('Maaf');
    expect(data.question_id).toBeDefined();
  });

  it('returns fallback when DeepSeek returns invalid JSON', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('deepseek')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'not valid json {{{' } }],
          }),
        });
      }
      return Promise.resolve({ ok: true });
    });
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: VALID_QUESTION }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.confidence).toBe('low');
  });

  it('normalises unknown confidence value to low', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('deepseek')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({ ...MOCK_DEEPSEEK_ANSWER, confidence: 'unknown' }),
              },
            }],
          }),
        });
      }
      return Promise.resolve({ ok: true });
    });
    const req = new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: VALID_QUESTION }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.confidence).toBe('low');
  });
});
