alter table public.user_credits
  add column if not exists daily_cycle_id text;

update public.user_credits
set daily_cycle_id = to_char((now() at time zone 'UTC')::date, 'YYYY-MM-DD')
where daily_cycle_id is null;

alter table public.user_credits
  alter column daily_cycle_id set not null;

create index if not exists user_credits_daily_cycle_idx on public.user_credits(daily_cycle_id);
