-- Phase 4: async campaign run progress (stub pipeline until real discovery in Phase 5).

alter table public.campaigns
  add column if not exists run_step text;

alter table public.campaigns
  add column if not exists run_progress smallint;

alter table public.campaigns
  add column if not exists run_error text;

alter table public.campaigns
  add column if not exists run_started_at timestamptz;

alter table public.campaigns
  add column if not exists run_completed_at timestamptz;

comment on column public.campaigns.run_step is 'Pipeline step key: queued, discover, rank, research, draft, done, failed.';
comment on column public.campaigns.run_progress is 'Rough percent 0–100 for UI.';
comment on column public.campaigns.run_error is 'Last run error message when status = failed.';
