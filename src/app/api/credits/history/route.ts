import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditHistoryPage } from '@/lib/credits';

export const dynamic = 'force-dynamic';

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const page = Number(req.nextUrl.searchParams.get('page') || 1);
  const pageSize = Number(req.nextUrl.searchParams.get('pageSize') || 30);
  const history = await getCreditHistoryPage({ userId, page, pageSize });

  return Response.json({ history });
}
