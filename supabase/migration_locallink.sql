-- LocalLink Logistics migration for the existing Supabase project.
-- Run this in Supabase Dashboard -> SQL Editor. It preserves existing columns and adds the website fields.

create extension if not exists pgcrypto;

alter table public.orders add column if not exists business_name text not null default '';
alter table public.orders add column if not exists pickup_time text;
alter table public.orders add column if not exists product_type text;
alter table public.orders add column if not exists weight_grams integer;
alter table public.orders add column if not exists order_value numeric(10,2);
alter table public.orders add column if not exists location text;
alter table public.orders add column if not exists instructions text not null default '';
alter table public.orders add column if not exists delivery_partner text;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists estimated_delivery_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

-- Drop older status constraints first, then normalise old values to the website's status names.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop execute format('alter table public.orders drop constraint %I', c.conname); end loop;
end $$;
update public.orders set status = 'Dispatched' where status = 'Picked Up';
alter table public.orders add constraint orders_status_check
  check (status in ('Booked','Dispatched','In Transit','Out for Delivery','Delivered','Delayed','Cancelled'));

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_weight_grams_check') then
    alter table public.orders add constraint orders_weight_grams_check check (weight_grams is null or weight_grams >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_order_value_check') then
    alter table public.orders add constraint orders_order_value_check check (order_value is null or order_value >= 0);
  end if;
end $$;

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_uuid uuid not null references public.orders(id) on delete cascade,
  status text not null,
  checkpoint text,
  notes text,
  event_at timestamptz not null default now()
);
create index if not exists tracking_events_order_event_idx on public.tracking_events(order_uuid,event_at desc);

do $$
declare c record;
begin
  for c in select conname from pg_constraint
    where conrelid = 'public.tracking_events'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop execute format('alter table public.tracking_events drop constraint %I', c.conname); end loop;
end $$;
update public.tracking_events set status = 'Dispatched' where status = 'Picked Up';
alter table public.tracking_events add constraint tracking_events_status_check
  check (status in ('Booked','Dispatched','In Transit','Out for Delivery','Delivered','Delayed','Cancelled'));

alter table public.enquiries add column if not exists business_name text not null default '';
alter table public.enquiries add column if not exists email text;
alter table public.enquiries add column if not exists phone text;
alter table public.enquiries add column if not exists category text not null default 'General enquiry';
alter table public.enquiries add column if not exists message text;

-- The browser must not read/write the raw orders table. The Edge Function uses the server-only service role key.
alter table public.orders enable row level security;
alter table public.tracking_events enable row level security;
alter table public.enquiries enable row level security;
revoke all on public.orders from anon, authenticated;
revoke all on public.tracking_events from anon, authenticated;
revoke all on public.enquiries from anon, authenticated;

create index if not exists orders_order_id_idx on public.orders(order_id);
