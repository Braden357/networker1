-- Phase 5: candidate list per campaign (mock discovery + ranking for MVP).

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  rank_order int not null,
  display_name text not null,
  headline text,
  profile_url text not null,
  source_label text not null,
  alumni_score int not null default 0,
  alumni_note text,
  fit_score int not null default 0,
  created_at timestamptz not null default now(),
  constraint candidates_rank_order_positive check (rank_order > 0)
);

create index if not exists candidates_campaign_rank_idx
  on public.candidates (campaign_id, rank_order);

alter table public.candidates enable row level security;

-- Read through campaign ownership (no direct user_id on candidates).
drop policy if exists "Users can read candidates for own campaigns" on public.candidates;
create policy "Users can read candidates for own campaigns"
  on public.candidates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns c
      where c.id = candidates.campaign_id
        and c.user_id = (select auth.uid())
    )
  );

comment on table public.candidates is 'Ordered suggestions per campaign; Phase 5 uses mock seed data with transparent source_label.';
comment on column public.candidates.source_label is 'Human-visible provenance, e.g. Mock: curated sample.';
comment on column public.candidates.alumni_note is 'Disclaimer when alumni is inferred, not verified.';
