-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'free' check (role in ('admin', 'paid', 'free', 'blocked')),
  lifetime_analyses integer not null default 0,
  daily_analyses integer not null default 0,
  last_analysis_date date,
  last_ip text,
  last_user_agent text,
  created_at timestamptz default now()
);

-- Usage logs table
create table if not exists public.usage_logs (
  id bigserial primary key,
  user_id uuid references public.users(id),
  email text,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.usage_logs enable row level security;

-- Service role can do everything (backend uses service key)
create policy "Service role full access on users"
  on public.users for all
  using (true)
  with check (true);

create policy "Service role full access on usage_logs"
  on public.usage_logs for all
  using (true)
  with check (true);

-- Set admin role for owner account
-- Run this after the owner signs up:
-- update public.users set role = 'admin' where email = 'kirtan.patel0515@gmail.com';
