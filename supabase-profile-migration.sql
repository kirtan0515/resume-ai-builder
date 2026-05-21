-- Run this in Supabase SQL Editor

create table if not exists public.resume_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text default '',
  email text default '',
  phone text default '',
  location text default '',
  linkedin text default '',
  github text default '',
  website text default '',
  summary text default '',
  skills jsonb default '[]'::jsonb,
  experience jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  template text default 'classic',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.resume_profiles enable row level security;

create policy "Service role full access on resume_profiles"
  on public.resume_profiles for all
  using (true)
  with check (true);
