import { NextResponse } from 'next/server';
import { sanitizeEvent } from '@/lib/analytics/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const incoming = Array.isArray((body as Record<string, unknown>).events)
    ? ((body as Record<string, unknown>).events as unknown[])
    : [];

  const events = incoming.map(sanitizeEvent).filter((event): event is NonNullable<typeof event> => Boolean(event));

  if (!events.length) {
    return NextResponse.json({ ok: false, message: 'No valid analytics events provided.' }, { status: 400 });
  }

  events.forEach((event) => {
    console.info('KIVO_ANALYTICS_EVENT', {
      event: event.name,
      ts: event.ts,
      sessionId: event.sessionId,
      conversationId: event.conversationId,
      messageId: event.messageId,
      requestId: event.requestId,
      properties: event.properties || {},
    });
  });

  return NextResponse.json({ ok: true, accepted: events.length });
}
