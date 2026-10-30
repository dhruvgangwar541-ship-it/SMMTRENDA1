-- SMMTRENDA1 payment integration migration
-- Run this in Supabase SQL Editor for the new project.
-- This migration does NOT create or credit a wallet.
alter table public.orders
  add column if not exists payment_reference text;

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- Keep payment status changes server-side. Do not add a client UPDATE policy.
