export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { enqueueEmailJob, processEmailJob, StructuredFailure } from '@/services/email-job-service';

function toFailure(code: string, provider: string, context: Record<string, unknown>): StructuredFailure {
  return { code, provider, context };
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const provider = payload?.provider || 'unknown';

  try {
    if (!payload || typeof payload !== 'object') {
      const failure = toFailure('INVALID_PAYLOAD', provider, {});
      return NextResponse.json({ success: false, error: failure }, { status: 400 });
    }

    const recipient = payload.recipient || payload.to;
    const subject = payload.subject || 'No Subject';
    const body = payload.body || '';
    const maxAttempts = Number(payload.maxAttempts || 5);

    if (!recipient) {
      const failure = toFailure('MISSING_RECIPIENT', provider, {});
      return NextResponse.json({ success: false, error: failure }, { status: 400 });
    }

    const jobId = await enqueueEmailJob({ recipient, subject, body, provider }, maxAttempts);
    const result = await processEmailJob(jobId);

    if (result.success) {
      return NextResponse.json({ success: true, jobId });
    }

    return NextResponse.json(
      {
        success: false,
        queued: true,
        jobId,
        error: result.failure,
      },
      { status: 202 },
    );
  } catch (error: unknown) {
    const failure = toFailure('OUTBOUND_EMAIL_ROUTE_FAILED', provider, {
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ success: false, error: failure }, { status: 500 });
  }
}
