create extension if not exists pgcrypto;

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  credits_balance integer not null default 0,
  monthly_credits integer not null default 0,
  free_credits integer not null default 0,
  monthly_used integer not null default 0,
  monthly_cycle_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reserved_amount integer not null,
  actual_amount integer,
  title text not null,
  reason text not null,
  status text not null check (status in ('reserved','charged','refunded','failed')),
  expires_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reservation_id uuid references public.credit_reservations(id) on delete set null,
  title text not null,
  amount integer not null,
  reason text not null,
  agent_tool text,
  status text not null check (status in ('reserved','charged','refunded','failed')),
  balance_after integer,
  created_at timestamptz not null default now()
);

create index if not exists user_credits_cycle_idx on public.user_credits(monthly_cycle_id);
create index if not exists credit_tx_user_created_idx on public.credit_transactions(user_id, created_at desc);
create index if not exists credit_res_user_created_idx on public.credit_reservations(user_id, created_at desc);

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.credit_reservations enable row level security;

do $$ begin
  create policy "Users can read own user_credits" on public.user_credits for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can read own credit_transactions" on public.credit_transactions for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can read own credit_reservations" on public.credit_reservations for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
