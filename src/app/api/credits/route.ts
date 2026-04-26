import { createClient } from '@/lib/supabase/server';
import { getCreditSnapshot } from '@/lib/credits';

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

export async function POST() {
  return Response.json(
    {
      error: 'METHOD_DISABLED',
      message: 'Credits can only be changed by trusted server-side actions.',
    },
    { status: 405 },
  );
}
