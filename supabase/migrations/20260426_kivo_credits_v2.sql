create table if not exists public.kivo_credit_accounts (
  user_id text primary key,
  plan text not null default 'free',
  credits integer not null default 100,
  daily_refresh_credits integer not null default 100,
  monthly_credits integer not null default 0,
  monthly_used integer not null default 0,
  last_daily_refresh date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kivo_credit_ledger (
  id text primary key,
  user_id text not null references public.kivo_credit_accounts(user_id) on delete cascade,
  action text not null,
  title text not null,
  amount integer not null,
  balance_after integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kivo_credit_ledger_user_created_idx
  on public.kivo_credit_ledger(user_id, created_at desc);

alter table public.kivo_credit_accounts enable row level security;
alter table public.kivo_credit_ledger enable row level security;

do $$ begin
  create policy "Users can read own credit account"
    on public.kivo_credit_accounts for select
    using (auth.uid()::text = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can read own credit ledger"
    on public.kivo_credit_ledger for select
    using (auth.uid()::text = user_id);
exception when duplicate_object then null; end $$;
