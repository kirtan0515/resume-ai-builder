-- Run this in Supabase SQL Editor

alter table public.users
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists plan text default 'free',
  add column if not exists current_period_end timestamptz;
