import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  PERSONAL_MEMORY_CATEGORIES,
  toPersonalMemoryType,
  type PersonalMemoryType,
} from '@/lib/memory/personal-memory';

type MemoryRow = {
  id: string;
  content: string | null;
  type: string | null;
  importance: number | null;
  created_at: string;
  updated_at: string | null;
};

function asType(value: string | null): PersonalMemoryType | null {
  if (!value) return null;
  const normalized = toPersonalMemoryType(value);
  return normalized === 'other' && value !== 'other' ? null : normalized;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const category = asType(searchParams.get('category'));

  let statement = supabase
    .from('memory')
    .select('id,content,type,importance,created_at,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(120);

  if (category) {
    statement = statement.eq('type', category);
  }

  const { data, error } = await statement;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = ((data || []) as MemoryRow[])
    .filter((item) => {
      if (!query) return true;
      return String(item.content || '').toLowerCase().includes(query);
    })
    .map((item) => ({
      id: item.id,
      content: String(item.content || ''),
      type: toPersonalMemoryType(item.type),
      importance: Number(item.importance || 0.4),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

  const categoryCounts = Object.fromEntries(
    PERSONAL_MEMORY_CATEGORIES.map((name) => [
      name,
      items.filter((item) => item.type === name).length,
    ]),
  );

  return NextResponse.json({
    items,
    categoryCounts,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    type?: string;
    importance?: number;
  };

  const content = String(body.content || '').trim();
  const type = asType(body.type || '') || 'other';
  const importance =
    typeof body.importance === 'number' && Number.isFinite(body.importance)
      ? Math.min(1, Math.max(0, body.importance))
      : 0.75;

  if (content.length < 8) {
    return NextResponse.json(
      { error: 'Memory content must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('memory')
    .insert({
      user_id: user.id,
      content: content.slice(0, 320),
      type,
      importance,
      updated_at: new Date().toISOString(),
    })
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

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = asType(searchParams.get('category'));

  let statement = supabase.from('memory').delete().eq('user_id', user.id);
  if (category) {
    statement = statement.eq('type', category);
  }

  const { error } = await statement;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clearedCategory: category || 'all' });
}
