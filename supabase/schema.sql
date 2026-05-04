-- =============================================================================
-- Hair Crezz Salon — Supabase schema
-- Run in Supabase SQL Editor (Project → SQL → New query → paste → Run).
-- Idempotent: safe to re-run.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.service_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  active     bool not null default true,
  sort_order int  not null default 0
);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  description  text,
  duration_min int  not null check (duration_min > 0),
  price        int  not null check (price >= 0),
  active       bool not null default true,
  sort_order   int  not null default 0
);

create table if not exists public.stylists (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  role         text not null,
  bio          text,
  photo_url    text,
  specialties  text[] not null default '{}',
  active       bool not null default true,
  sort_order   int  not null default 0
);

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone         text not null,
  email         text,
  service_id    uuid not null references public.services(id) on delete restrict,
  stylist_id    uuid     references public.stylists(id) on delete set null,
  date          date not null,
  time          text not null,            -- HH:mm
  duration_min  int  not null,
  price         int  not null,
  notes         text,
  status        text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  created_at    timestamptz not null default now()
);
create index if not exists bookings_date_idx on public.bookings(date);
create index if not exists bookings_status_idx on public.bookings(status);

create table if not exists public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  caption    text,
  sort_order int  not null default 0
);

create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  rating     int  not null check (rating between 1 and 5),
  body       text not null,
  source     text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  day_of_week int primary key check (day_of_week between 0 and 6),
  open_time   text,
  close_time  text,
  closed      bool not null default false
);

create table if not exists public.blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  start_time text not null,
  end_time   text not null,
  reason     text
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- Anonymous visitors can READ catalog data + CREATE bookings.
-- Only authenticated admins can read bookings or modify anything else.
-- ---------------------------------------------------------------------------
alter table public.services       enable row level security;
alter table public.service_categories enable row level security;
alter table public.stylists       enable row level security;
alter table public.bookings       enable row level security;
alter table public.gallery_images enable row level security;
alter table public.testimonials   enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_slots  enable row level security;

-- helper: drop+create policy idempotently
do $$
begin
  -- public read
  perform 1 from pg_policies where tablename='service_categories' and policyname='public_read';
  if not found then create policy public_read on public.service_categories for select using (true); end if;
  perform 1 from pg_policies where tablename='services' and policyname='public_read';
  if not found then create policy public_read on public.services       for select using (true); end if;
  perform 1 from pg_policies where tablename='stylists' and policyname='public_read';
  if not found then create policy public_read on public.stylists       for select using (true); end if;
  perform 1 from pg_policies where tablename='gallery_images' and policyname='public_read';
  if not found then create policy public_read on public.gallery_images for select using (true); end if;
  perform 1 from pg_policies where tablename='testimonials' and policyname='public_read';
  if not found then create policy public_read on public.testimonials   for select using (true); end if;
  perform 1 from pg_policies where tablename='business_hours' and policyname='public_read';
  if not found then create policy public_read on public.business_hours for select using (true); end if;
  perform 1 from pg_policies where tablename='blocked_slots' and policyname='public_read';
  if not found then create policy public_read on public.blocked_slots  for select using (true); end if;

  -- bookings: anonymous can insert; only authed can read/update/delete
  perform 1 from pg_policies where tablename='bookings' and policyname='anon_insert';
  if not found then create policy anon_insert on public.bookings for insert with check (true); end if;
  perform 1 from pg_policies where tablename='bookings' and policyname='auth_read';
  if not found then create policy auth_read on public.bookings for select using (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='bookings' and policyname='auth_modify';
  if not found then create policy auth_modify on public.bookings for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='bookings' and policyname='auth_delete';
  if not found then create policy auth_delete on public.bookings for delete using (auth.role() = 'authenticated'); end if;

  -- catalog write: authed only
  perform 1 from pg_policies where tablename='service_categories' and policyname='auth_write';
  if not found then create policy auth_write on public.service_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='services' and policyname='auth_write';
  if not found then create policy auth_write on public.services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='stylists' and policyname='auth_write';
  if not found then create policy auth_write on public.stylists for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='gallery_images' and policyname='auth_write';
  if not found then create policy auth_write on public.gallery_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='testimonials' and policyname='auth_write';
  if not found then create policy auth_write on public.testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='business_hours' and policyname='auth_write';
  if not found then create policy auth_write on public.business_hours for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
  perform 1 from pg_policies where tablename='blocked_slots' and policyname='auth_write';
  if not found then create policy auth_write on public.blocked_slots for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); end if;
end$$;

-- ---------------------------------------------------------------------------
-- Seed (only if tables are empty)
-- ---------------------------------------------------------------------------
insert into public.service_categories(name, sort_order) values
  ('Hair',1),
  ('Spa',2),
  ('Skin',3),
  ('Bridal',4),
  ('Nails',5),
  ('Waxing',6)
on conflict (name) do nothing;

insert into public.business_hours(day_of_week, open_time, close_time, closed) values
  (0,'10:00','19:00',false),
  (1,'10:00','20:00',false),
  (2,'10:00','20:00',false),
  (3,'10:00','20:00',false),
  (4,'10:00','20:00',false),
  (5,'10:00','21:00',false),
  (6,'09:00','21:00',false)
on conflict (day_of_week) do nothing;
