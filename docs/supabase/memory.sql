create table if not exists public.memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  type text not null default 'other',
  importance numeric not null default 0.4,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists memory_user_updated_idx
  on public.memory (user_id, updated_at desc);

alter table public.memory enable row level security;

create policy if not exists "memory_select_own"
on public.memory
for select
using (auth.uid() = user_id);

create policy if not exists "memory_insert_own"
on public.memory
for insert
with check (auth.uid() = user_id);

create policy if not exists "memory_update_own"
on public.memory
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "memory_delete_own"
on public.memory
for delete
using (auth.uid() = user_id);
