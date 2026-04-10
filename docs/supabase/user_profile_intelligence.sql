-- Lightweight personalization profile for adaptive assistant behavior.
create table if not exists public.user_profile_intelligence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'en',
  language_confidence numeric not null default 0.55 check (language_confidence >= 0 and language_confidence <= 1),
  decision_style text not null default 'balanced' check (decision_style in ('aggressive', 'balanced', 'conservative')),
  savings_focus text not null default 'medium' check (savings_focus in ('low', 'medium', 'high')),
  verbosity_preference text not null default 'medium' check (verbosity_preference in ('short', 'medium', 'detailed')),
  risk_tolerance text not null default 'medium' check (risk_tolerance in ('low', 'medium', 'high')),
  behavior_summary text not null default '',
  last_updated timestamptz not null default timezone('utc', now())
);

create index if not exists user_profile_intelligence_last_updated_idx
  on public.user_profile_intelligence (last_updated desc);

alter table public.user_profile_intelligence enable row level security;

create policy if not exists "user_profile_intelligence_select_own"
on public.user_profile_intelligence
for select
using (auth.uid() = user_id);

create policy if not exists "user_profile_intelligence_insert_own"
on public.user_profile_intelligence
for insert
with check (auth.uid() = user_id);

create policy if not exists "user_profile_intelligence_update_own"
on public.user_profile_intelligence
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "user_profile_intelligence_delete_own"
on public.user_profile_intelligence
for delete
using (auth.uid() = user_id);
