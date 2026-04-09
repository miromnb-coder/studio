-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

-- Users can only view their own profile
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

-- Users can insert their own profile row
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

-- Users can update only their own profile row
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
