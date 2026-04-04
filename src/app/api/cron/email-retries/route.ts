export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { processDueEmailJobs, StructuredFailure } from '@/services/email-job-service';

function toFailure(code: string, provider: string, context: Record<string, unknown>): StructuredFailure {
  return { code, provider, context };
}

export async function POST() {
  try {
    const result = await processDueEmailJobs();
    return NextResponse.json({
      success: result.failures.length === 0,
      processed: result.processed,
      failures: result.failures,
    });
  } catch (error: unknown) {
    const failure = toFailure('EMAIL_RETRY_CRON_FAILED', 'system', {
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ success: false, error: failure }, { status: 500 });
  }
}
