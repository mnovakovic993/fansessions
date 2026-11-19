-- Fan Sessions database schema.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  fanvue_user_uuid text unique not null,
  handle text,
  display_name text,
  timezone text not null default 'Europe/London',
  accepting boolean not null default false,
  buffer_min integer not null default 15,
  access_token_enc text,
  refresh_token_enc text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  duration_min integer not null check (duration_min in (10, 15, 20, 30, 45, 60)),
  price_cents integer not null check (price_cents between 300 and 50000),
  active boolean not null default true,
  external_action_id text,
  created_at timestamptz not null default now(),
  unique (creator_id, duration_min)
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Monday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  date date not null,
  unique (creator_id, date)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  fan_uuid text not null,
  package_id uuid references packages(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'held' check (status in (
    'held','confirmed','completed','expired','cancelled_by_fan',
    'cancelled_by_creator','no_show_fan','no_show_creator','refunded')),
  hold_expires_at timestamptz,
  purchase_ref text unique,
  daily_room text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_creator_time on bookings (creator_id, starts_at);

create table if not exists webhook_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- The app talks to the database only from the server with the service role key,
-- so row level security is switched on with no public policies (nobody else can read it).
alter table creators enable row level security;
alter table packages enable row level security;
alter table availability_rules enable row level security;
alter table blocked_dates enable row level security;
alter table bookings enable row level security;
alter table webhook_events enable row level security;

-- Newer Supabase projects do not grant table access to the server role automatically.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
