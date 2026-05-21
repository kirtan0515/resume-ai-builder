-- Run this in Supabase SQL Editor

-- Job search cache
create table if not exists public.job_searches (
  id bigserial primary key,
  user_id uuid references public.users(id),
  query text not null,
  location text,
  results_count integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.job_searches enable row level security;

create policy "Service role full access on job_searches"
  on public.job_searches for all
  using (true)
  with check (true);
