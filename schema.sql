-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query → paste & run

create table inventory (
  id          text primary key,
  name        text not null,
  category    text default 'General',
  notes       text default '',
  status      text default 'available',
  customer_id text,
  customer_name text,
  date_added  date default current_date,
  created_at  timestamptz default now()
);

create table customers (
  id          text primary key,
  name        text not null,
  phone       text default '',
  address     text default '',
  notes       text default '',
  date_added  date default current_date,
  created_at  timestamptz default now()
);

create table pricing (
  id          text primary key,
  item_name   text not null,
  category    text default '',
  price       numeric(10,2) not null,
  unit        text default 'unit',
  notes       text default '',
  date_added  date default current_date,
  created_at  timestamptz default now()
);

-- Enable Row Level Security (RLS) — allows public access for now
-- In production, add auth and proper policies
alter table inventory enable row level security;
alter table customers enable row level security;
alter table pricing   enable row level security;

create policy "public read/write inventory" on inventory for all using (true) with check (true);
create policy "public read/write customers" on customers for all using (true) with check (true);
create policy "public read/write pricing"   on pricing   for all using (true) with check (true);
