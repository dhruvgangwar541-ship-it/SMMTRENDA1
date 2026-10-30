-- SMMTRENDA1 starter schema
-- Run in Supabase SQL Editor after creating a project.
-- This schema stores service requests. Payment verification must be done server-side.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id text not null,
  service_name text not null,
  amount numeric(10,2) not null check (amount >= 0),
  customer_link text not null,
  notes text not null default '',
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','paid','in_progress','completed','cancelled','refunded')),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert to authenticated
  with check (auth.uid() = user_id);

-- Deliberately no client-side update policy for payment status.
-- Only a trusted server-side webhook/function should update paid/refunded statuses.
