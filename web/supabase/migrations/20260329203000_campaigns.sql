-- Phase 3: campaign drafts (prompt + extracted parameters JSON).
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'running', 'complete', 'failed')),
  raw_prompt text not null,
  extracted_parameters jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_created_at_idx
  on public.campaigns (user_id, created_at desc);

alter table public.campaigns enable row level security;

drop policy if exists "Users can read own campaigns" on public.campaigns;
create policy "Users can read own campaigns"
  on public.campaigns
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own campaigns" on public.campaigns;
create policy "Users can insert own campaigns"
  on public.campaigns
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own campaigns" on public.campaigns;
create policy "Users can update own campaigns"
  on public.campaigns
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own campaigns" on public.campaigns;
create policy "Users can delete own campaigns"
  on public.campaigns
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.campaigns is 'Networking campaign: user prompt and structured parameters (Phase 3).';
comment on column public.campaigns.extracted_parameters is 'Snapshot after LLM extract + user edits (JSON).';
