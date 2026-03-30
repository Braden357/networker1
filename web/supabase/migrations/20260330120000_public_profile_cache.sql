-- Phase 6: shared public profile cache + research artifact (cross-user dedupe, RLS for reads).

create table if not exists public.public_profile_cache (
  id uuid primary key default gen_random_uuid(),
  canonical_profile_url text not null,
  last_fetched_at timestamptz not null default now(),
  display_name text,
  headline text,
  research_artifact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint public_profile_cache_canonical_url_unique unique (canonical_profile_url)
);

create index if not exists public_profile_cache_last_fetched_idx
  on public.public_profile_cache (last_fetched_at desc);

comment on table public.public_profile_cache is
  'Deduped enrichment by canonical LinkedIn public URL; research_artifact holds Phase 6 ResearchArtifact JSON.';
comment on column public.public_profile_cache.canonical_profile_url is
  'Normalized URL (no query/hash); unique key for reuse across users.';
comment on column public.public_profile_cache.research_artifact is
  'Structured research card (summary, bullets, confidence); see app Zod schema.';

alter table public.candidates
  add column if not exists public_profile_cache_id uuid
    references public.public_profile_cache (id) on delete restrict;

create index if not exists candidates_public_profile_cache_id_idx
  on public.candidates (public_profile_cache_id);

alter table public.public_profile_cache enable row level security;

-- Writes only via service role (no policies for authenticated on insert/update/delete).

drop policy if exists "Users read public_profile_cache via own candidates" on public.public_profile_cache;
create policy "Users read public_profile_cache via own candidates"
  on public.public_profile_cache
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.candidates c
      inner join public.campaigns cp on cp.id = c.campaign_id
      where c.public_profile_cache_id = public_profile_cache.id
        and cp.user_id = (select auth.uid())
    )
  );
