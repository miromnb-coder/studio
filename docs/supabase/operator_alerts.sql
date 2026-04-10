-- Proactive operator alerts table + policies
create table if not exists public.operator_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'active' check (status in ('active', 'dismissed', 'completed')),
  title text not null,
  summary text not null,
  suggested_action text not null,
  source text not null,
  dedupe_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists operator_alerts_user_dedupe_uidx
  on public.operator_alerts (user_id, dedupe_key);

create index if not exists operator_alerts_user_idx
  on public.operator_alerts (user_id);

create index if not exists operator_alerts_status_idx
  on public.operator_alerts (status);

create index if not exists operator_alerts_created_at_idx
  on public.operator_alerts (created_at desc);

create index if not exists operator_alerts_dedupe_idx
  on public.operator_alerts (dedupe_key);

alter table public.operator_alerts enable row level security;

create policy if not exists "operator_alerts_select_own"
on public.operator_alerts
for select
using (auth.uid() = user_id);

create policy if not exists "operator_alerts_insert_own"
on public.operator_alerts
for insert
with check (auth.uid() = user_id);

create policy if not exists "operator_alerts_update_own"
on public.operator_alerts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "operator_alerts_delete_own"
on public.operator_alerts
for delete
using (auth.uid() = user_id);
