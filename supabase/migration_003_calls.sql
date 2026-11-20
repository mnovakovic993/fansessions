-- Phase 3: problem reports from calls.
create table if not exists call_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  reporter_role text not null check (reporter_role in ('fan', 'creator')),
  reporter_uuid text,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table call_reports enable row level security;
grant all on call_reports to service_role;
