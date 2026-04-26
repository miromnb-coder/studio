import { NextRequest } from 'next/server';
import { grantCredits, readCreditAccount } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function GET() {
  const account = readCreditAccount();
  return Response.json(account);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount || 0);
  if (!amount) return Response.json({ error: 'invalid_amount' }, { status: 400 });
  const account = grantCredits({ amount, title: body?.title || 'Credits added' });
  return Response.json(account);
}
