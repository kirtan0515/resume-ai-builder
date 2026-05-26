-- Run in Supabase SQL Editor

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  company text not null,
  url text default '',
  location text default '',
  status text default 'applied' check (status in ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  match_score integer default 0,
  notes text default '',
  applied_date date default current_date,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.applications enable row level security;

create policy "Service role full access on applications"
  on public.applications for all
  using (true)
  with check (true);
