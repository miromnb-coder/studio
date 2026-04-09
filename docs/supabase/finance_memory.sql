-- Smart memory and dashboard support (safe, additive migration)

alter table if exists public.finance_profiles
  add column if not exists total_monthly_cost numeric,
  add column if not exists memory_summary text;

create table if not exists public.memory_embeddings (
  id bigserial primary key,
  user_id uuid not null,
  domain text not null,
  source_type text not null,
  content text not null,
  embedding jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists memory_embeddings_user_idx
  on public.memory_embeddings (user_id, created_at desc);
