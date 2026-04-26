import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditSnapshot, grantCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  return Response.json(await getCreditSnapshot({ userId }));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount || 0);
  if (!amount) return Response.json({ error: 'invalid_amount' }, { status: 400 });

  const granted = await grantCredits({ userId, amount, reason: body?.reason || body?.title || 'Credits added' });
  return Response.json(granted);
}
