import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toPersonalMemoryType } from '@/lib/memory/personal-memory';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: Params) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    type?: string;
    importance?: number;
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.content === 'string' && body.content.trim().length >= 8) {
    updates.content = body.content.trim().slice(0, 320);
  }

  if (typeof body.type === 'string') {
    updates.type = toPersonalMemoryType(body.type);
  }

  if (typeof body.importance === 'number' && Number.isFinite(body.importance)) {
    updates.importance = Math.min(1, Math.max(0, body.importance));
  }

  const { data, error } = await supabase
    .from('memory')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,content,type,importance,created_at,updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: data.id,
      content: data.content,
      type: toPersonalMemoryType(data.type),
      importance: data.importance,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}

export async function DELETE(_req: Request, context: Params) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const { id } = await context.params;

  const { error } = await supabase
    .from('memory')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
