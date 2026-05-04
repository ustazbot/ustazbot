import { NextResponse } from 'next/server';
import { fireWebhook } from '@/lib/webhook';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (body && typeof body.event === 'string') {
    fireWebhook({ ...body, timestamp: body.timestamp ?? new Date().toISOString() });
  }
  return NextResponse.json({ ok: true });
}
