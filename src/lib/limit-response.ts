import { NextResponse } from 'next/server';
import type { LimitCheckResult } from './usage';

export function createLimitReachedResponse(
  result: Extract<LimitCheckResult, { ok: false }>,
) {
  return NextResponse.json(
    {
      error: 'limit_reached',
      message: result.message,
      limitKey: result.limitKey,
      limitValue: result.limitValue,
      currentValue: result.currentValue,
      plan: result.plan,
      upgradeTarget: result.upgradeTarget,
    },
    { status: 402 },
  );
}
