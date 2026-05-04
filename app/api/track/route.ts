import { NextResponse } from 'next/server';
import { fireWebhook } from '@/lib/webhook';

const VALID_EVENTS = new Set(['click_chatgpt', 'click_umrah']);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (body && typeof body.event === 'string' && VALID_EVENTS.has(body.event)) {
    fireWebhook({ ...body, timestamp: body.timestamp ?? new Date().toISOString() });
  }
  return NextResponse.json({ ok: true });
}
