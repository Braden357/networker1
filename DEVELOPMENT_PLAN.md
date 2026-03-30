# Development plan (from `PROJECT_SPEC_FROM_INTERVIEW.md`)

Use this as a **sequential build guide**. Each phase ends in something **runnable** or **deployable** so you never have a long stretch with nothing to show. Adjust pace to your schedule; the spec assumes **no fixed deadline**.

**Canonical spec:** `PROJECT_SPEC_FROM_INTERVIEW.md`

---

## Principles (carry through every phase)

1. **Ship thin vertical slices** — auth → one screen → one API → one DB table → deploy. Avoid building all UI before any backend.
2. **Secrets never in Git** — API keys only in `.env.local` (gitignored) and host env (Vercel). Use a `.env.example` with **placeholder names only**.
3. **Server-only for LLM and paid APIs** — no provider keys in the browser.
4. **Row Level Security (RLS) on Supabase** — every table with user data: users can only read/write their own rows (plus explicit rules for shared `PublicProfileCache` if it holds cross-user data).
5. **Idempotent jobs** — campaign runs should survive retries without double-charging LLM or duplicating candidates (use `campaign_id` + unique constraints where needed).
6. **Caps in code** — enforce **~50 per run** and **~2 runs/week** per user in application logic (spec §15), not only in documentation.

---

## Phase 0 — Repository and collaboration (before “real” features)

### Goals

- Version control, backups of code, and a clean place to grow the project.

### Actions

| Step | What to do |
|------|------------|
| **Initialize Git** | If not already: `git init` in the project folder. |
| **GitHub** | Create a **private** repo (recommended while iterating; flip public later if you want). |
| **Connect** | `git remote add origin …` and push `main` (or `master`; pick one convention). |
| **Branching** | Use **trunk-based** habit: `main` = deployable; short-lived branches `feature/…` or `fix/…`; merge via PR when you’re comfortable. |
| **`.gitignore`** | Node/Next defaults + `.env*.local` + OS junk. Never commit Supabase service role key. |
| **README** | One page: what the app is, how to run locally, link to spec. |

### GitHub settings (best practice)

- **Branch protection** on `main` (optional solo: require PR or require status checks later).
- **Dependabot** or **Renovate** for dependency updates (reduces security drift).
- **No secrets** in issues, PRs, or commit messages.

### Definition of done

- Code exists on GitHub; another machine could clone and run (once you add app code and env instructions).

---

## Phase 1 — Accounts, project skeleton, first deploy

### Goals

- **Next.js (App Router)** + **TypeScript** + **Supabase Auth (email/password)** + **Supabase Postgres** + **Vercel** deploy.

### Build order

1. `create-next-app` with TypeScript, ESLint, App Router.
2. Supabase project: enable **Auth** (email/password); configure **Site URL** and **redirect URLs** for local + Vercel preview URLs.
3. Install `@supabase/supabase-js`; client only for **session**; use **server client** (cookies) for protected routes—follow current Supabase + Next.js patterns.
4. Pages: **sign up**, **sign in**, **sign out**; protected **dashboard** shell (empty state).
5. **Vercel** project linked to GitHub; env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon is OK in client); **service role key only on server** if you use admin APIs—prefer avoiding service role in early MVP except migrations/scripts.
6. **Database:** minimal tables via Supabase SQL migrations (folder `supabase/migrations` if using CLI, or SQL editor to start—migrate to file-based migrations before collaborators).

### Schema (minimal)

- `profiles` or extend `auth.users` pattern: `user_id`, `linkedin_profile_url` (nullable), timestamps.
- Enable **RLS**; policies: `user_id = auth.uid()` for user-owned rows.

### Definition of done

- Sign up / sign in works in prod; dashboard loads only when authenticated.

### Blind spots here

- **Email confirmation** — Supabase may require email confirm; configure for dev (auto-confirm) vs prod.
- **Preview deployments** — add every Vercel preview URL to Supabase redirect allowlist or use a wildcard pattern if supported.

---

## Phase 2 — Student profile and “static” settings

### Goals

- Manual **school, graduation year, major**, **US-only** copy hints optional; **LinkedIn profile URL** field.

### Actions

- Form + validation (Zod recommended); save to `profiles` or `student_profiles`.
- Display on dashboard; edit/save.

### Definition of done

- Data persists across sessions; RLS prevents cross-user access.

### Blind spots

- **Validation** — graduation year range, URL format for LinkedIn.
- **PII** — treat school + email as sensitive; no logging full payloads in production logs.

---

## Phase 3 — Prompt → extract → editable checklist (no heavy jobs yet)

### Goals

- Core UX from spec §3 and §13: **large prompt** → **LLM extracts structured parameters** → **editable checklist** → user confirms.

### Actions

- **Server action or Route Handler** calls LLM with a strict **JSON schema** (or function calling) for fields in spec §3 (geography, role, industry, seniority, etc.).
- Store **Campaign** in `draft` with `raw_prompt` + `extracted_parameters` (JSON).
- Second step: user edits checklist; save snapshot as **ExtractedParameters** (versioned if you re-run extraction).

### Definition of done

- End-to-end: prompt → structured fields → saved campaign draft **without** candidate discovery.

### Blind spots

- **Hallucinated parameters** — LLM may invent filters; UI must let users fix everything.
- **Cost** — log token usage per request; set a max prompt size.

---

## Phase 4 — Campaign run: job queue + progress UI

### Goals

- “We’re working” **progress** (spec §3); **async** work because research exceeds serverless timeouts (spec §11).

### Actions

1. On “Run,” set campaign `running`; enqueue job ( **Inngest**, **Trigger.dev**, **QStash + worker**, or Supabase **pg_net** / Edge — pick one and stick to it).
2. Worker steps: **discover** → **rank** → **research** → **draft** (can stub discovery first).
3. **Polling or SSE:** client reads `campaign.status` and step progress from DB.
4. **Failure handling:** `failed` + user-visible error + retry policy.

### Definition of done

- A run completes asynchronously; user sees progress; refresh survives disconnect.

### Blind spots

- **Vercel timeout** — never do 5 minutes of LLM in a single HTTP request; always **worker**.
- **Exactly-once** — design jobs so retries don’t duplicate 50 candidates (unique `(campaign_id, profile_url)` or similar).
- **Cost cap** — abort or trim if LLM spend exceeds threshold per campaign.

---

## Phase 5 — Discovery and ranking (MVP realism)

### Goals

- **~50 candidates** per run; **alumni-first** ranking (spec §4, §9).

### Reality check (important)

- **LinkedIn does not expose** a full “search the graph” API for consumer apps the way your UX implies. **Plan for:** mixed approach — **public** sources (job boards, company pages, **user-imported** CSV of URLs, optional **official** partner APIs if you ever qualify), plus **manual paste** of profile URLs for early dogfood.
- Document **what v1 actually does** (e.g. “suggestions from X + Y”) so you’re not blocked pretending full LinkedIn search exists.

### Actions

- Implement **one** discovery source first (e.g. curated list, Apify actor for **public** pages you’re allowed to use, or mock data for UI).
- **Ranking function:** score alumni match (school string match on headline/summary if available), title match (FA, intern), geography.
- **Caps** — enforce 50 and weekly limit in DB or Redis-backed counter.

### Definition of done

- User gets an ordered list of up to 50 **with** transparent **source** labels (“from job board,” “from pasted URL,” etc.).

### Blind spots

- **Legal / ToS** — scraping LinkedIn HTML at scale is **high risk**; prefer official APIs, licensed data, or user-driven inputs.
- **Accuracy** — “alumni” without verified graph data is **guesswork**; show **confidence** or “possible alumni.”

---

## Phase 6 — Research cards + PublicProfileCache

### Goals

- Rich **research** (spec §5); **dedupe** via **PublicProfileCache** (spec §12, §18).

### Actions

- Normalize **canonical profile URL** (strip tracking params).
- Before LLM-heavy enrichment, **lookup cache**; if fresh enough, reuse; else fetch + summarize + store.
- Attach **ResearchArtifact** to cache row; **Candidate** references cache.

### Definition of done

- Second user with overlapping targets reuses cache; logs show fewer duplicate LLM calls.

### Blind spots

- **Stale data** — `last_fetched_at` + TTL or user “refresh” button.
- **GDPR / privacy** — indefinite retention (spec §10) conflicts with **right to erasure** in some jurisdictions; plan **delete user data** and **anonymize or delete cache rows** when required.
- **Cross-user cache** — if cache has PII, **RLS** must allow read for enrichment jobs without leaking other users’ campaigns.

---

## Phase 7 — Drafts: connection note + first DM (no send)

### Goals

- **DraftMessage** per candidate; professional tone (spec §2); **copy to clipboard** + optional **deep link** to LinkedIn (user sends manually).

### Actions

- Server-side LLM with **template + user context** (school, goal); store drafts; allow edit in UI.
- **Copy** button; track `OutreachState` (`copied`, etc.).

### Definition of done

- User can run campaign → review list → copy drafts → send in LinkedIn **outside** the app.

### Blind spots

- **Hallucinations** — never auto-assert facts about the recipient; “based on public profile” disclaimers in UI.
- **Safety** — optional light block for slurs/harassment without over-censoring (your spec prefers light guardrails).

---

## Phase 8 — Hardening for a private demo

### Goals

- **Admin manual password reset** (spec §10): document procedure (Supabase dashboard or one-off script).
- **Observability** — structured logs for job failures; error tracking (Sentry optional).
- **Rate limits** — middleware on expensive routes.
- **Privacy policy** page (even short): what you store, shared cache, US MVP.

### Definition of done

- You can invite testers; you can reset an account manually; you can see why a job failed.

---

## Phase 9 — After MVP (optional roadmap)

| Item | Notes |
|------|--------|
| Self-service password reset | Supabase built-in flows |
| Stripe + paid tier | Spec §7; metered LLM / higher caps |
| LinkedIn OAuth | Only when you have a **clear** API use case |
| International | Spec says US-only MVP |
| `.edu` verification | Trust signal for alumni matching |

---

## GitHub workflow (summary)

| Practice | Why |
|----------|-----|
| **Conventional commits** (`feat:`, `fix:`) | Readable history, changelog automation later |
| **Small PRs / merges** | Easier review and bisect when something breaks |
| **CI** (GitHub Actions) | Run `lint` + `typecheck` + `test` on every push |
| **Protected `main`** | Prevents accidental force-push |
| **Environment parity** | Same env var *names* in Vercel preview and prod; different values |

---

## Blind spots and risks (what’s easy to miss)

### Legal, platform, and ethics

| Topic | Why it matters |
|--------|----------------|
| **LinkedIn User Agreement / API terms** | Automation and data use are restricted; **your product goal** may outpace **what’s allowed** without a partner program. |
| **Scraping** | Third-party scraping of LinkedIn is a **ban and legal** risk zone; have a **written** data strategy. |
| **Shared cache + retention** | Efficient for cost; requires **privacy policy**, **deletion** path, and possibly **region** strategy (EU users). |
| **“Student outreach” at scale** | Can look like spam to recipients; reputational risk to **you** and **users**. |

### Technical

| Topic | Why it matters |
|--------|----------------|
| **RLS gaps** | One mistake exposes all campaigns; test with two test accounts. |
| **Service role misuse** | Bypasses RLS; use narrowly in migrations or admin-only server code. |
| **LLM cost spikes** | Uncapped retries or huge context = surprise bills; **budget alerts** on OpenAI (or provider). |
| **Job queue failures** | Users stuck in `running`; need **timeout** and **manual recover**. |
| **Pasted LinkedIn URLs** | Malicious URLs (open redirect) — validate allowlist domain `linkedin.com`. |

### Product

| Topic | Why it matters |
|--------|----------------|
| **Discovery quality** | If suggestions are bad, drafts don’t matter; invest in **evals** or manual review early. |
| **Alumni ranking without data** | Mismatch expectations; be honest in UI. |
| **Success metric** | “Reply + conversation” is **outside** the app—consider simple **user checkboxes** (“got a reply”) for your own learning. |

### Operations

| Topic | Why it matters |
|--------|----------------|
| **Single admin reset** | Does not scale; OK for demo, not for launch. |
| **Backups** | Supabase tier-dependent; know **restore** steps. |
| **Dependency risk** | LLM provider outage = your app down; show graceful degradation. |

---

## Suggested order of files / areas to create (reference)

Not prescriptive naming, but a sensible tree as you grow:

- `app/` — routes, layouts, server components  
- `app/api/` or server actions — LLM, campaigns  
- `lib/supabase/` — server client, middleware  
- `lib/jobs/` — queue handlers  
- `lib/llm/` — prompts, schemas, token counting  
- `supabase/migrations/` — SQL  
- `components/` — UI  
- `.env.example` — documented vars  

---

## How to use this doc

1. Complete **Phase 0–1** before building features that need auth.  
2. Stop after each phase and **deploy** or **demo** to yourself.  
3. When in doubt, re-read **`PROJECT_SPEC_FROM_INTERVIEW.md`** §10–12 (Round 4 + data model).

---

*Aligned with `PROJECT_SPEC_FROM_INTERVIEW.md`. Update this plan when the spec changes.*
