create table if not exists public.recommendation_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id text not null,
  recommended_action text not null,
  status text not null check (status in ('accepted', 'ignored', 'postponed', 'completed')),
  estimated_monthly_impact numeric(12,2),
  realized_impact numeric(12,2),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recommendation_id)
);

create index if not exists idx_recommendation_outcomes_user_updated
  on public.recommendation_outcomes (user_id, updated_at desc);

alter table public.recommendation_outcomes enable row level security;

create policy if not exists "Users can view own recommendation outcomes"
  on public.recommendation_outcomes
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can upsert own recommendation outcomes"
  on public.recommendation_outcomes
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own recommendation outcomes"
  on public.recommendation_outcomes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
