-- Phase 2: student profile fields (school, graduation year, major).
-- Run in Supabase SQL Editor after the initial profiles migration.

alter table public.profiles
  add column if not exists school text;

alter table public.profiles
  add column if not exists graduation_year integer;

alter table public.profiles
  add column if not exists major text;

comment on column public.profiles.school is 'University or college name (manual entry, MVP US-focused).';
comment on column public.profiles.graduation_year is 'Expected or actual graduation year.';
comment on column public.profiles.major is 'Primary field of study.';
