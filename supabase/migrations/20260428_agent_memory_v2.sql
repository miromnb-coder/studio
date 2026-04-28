create table if not exists public.kivo_agent_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('project','preference','decision','personal_context','do_not_repeat')),
  memory_key text not null,
  content text not null,
  confidence numeric(4,3) not null default 0.7,
  source_label text not null default 'chat',
  source_ref text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz,
  archived_at timestamptz
);

create unique index if not exists kivo_agent_memories_user_key_idx
  on public.kivo_agent_memories(user_id, memory_key);

create index if not exists kivo_agent_memories_user_updated_idx
  on public.kivo_agent_memories(user_id, updated_at desc)
  where archived_at is null;

alter table public.kivo_agent_memories enable row level security;

create policy if not exists "kivo_agent_memories_select_own"
  on public.kivo_agent_memories
  for select
  using (auth.uid() = user_id);

create policy if not exists "kivo_agent_memories_insert_own"
  on public.kivo_agent_memories
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "kivo_agent_memories_update_own"
  on public.kivo_agent_memories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.kivo_agent_memories_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kivo_agent_memories_touch_updated_at on public.kivo_agent_memories;
create trigger kivo_agent_memories_touch_updated_at
before update on public.kivo_agent_memories
for each row execute function public.kivo_agent_memories_touch_updated_at();
