import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { PLAN_LIMITS, SubscriptionService } from '@/services/subscription-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) {
      return NextResponse.json({ error: 'FIRESTORE_UNAVAILABLE' }, { status: 500 });
    }

    const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

    return NextResponse.json({
      plan,
      usage: {
        ...usage,
        limit: limits.dailyAgentRuns,
        remaining: Math.max(limits.dailyAgentRuns - usage.agentRuns, 0),
      },
    });
  } catch (error) {
    console.error('USAGE_ROUTE_ERROR', error);
    return NextResponse.json({ error: 'USAGE_FETCH_FAILED' }, { status: 500 });
  }
}
