-- Run in Supabase SQL Editor
alter table public.resume_profiles add column if not exists resume_text text default '';
