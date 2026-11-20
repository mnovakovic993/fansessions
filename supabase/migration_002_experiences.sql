-- Phase 2: link each creator to their booking experience on Fanvue.
alter table creators add column if not exists experience_uuid text;
