# Networker (web)

Next.js app for [Phase 1](../DEVELOPMENT_PLAN.md): authentication, Supabase-backed profiles, protected dashboard, Vercel-ready deploy.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in values from Supabase **Project Settings → API** (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)). Add **`OPENAI_API_KEY`** for campaign extraction (Phase 3).

   **Monorepo:** you can put `OPENAI_API_KEY` in **`web/.env.local`** or in the **repo-root** `.env` (one folder above `web/`). `next.config.ts` loads the parent env for local dev. **Vercel** only sees variables you set in the Vercel project (and `web/.env*` in the deployed repo)—set `OPENAI_API_KEY` and **`SUPABASE_SERVICE_ROLE_KEY`** (Phase 4 background runs) there too. Never commit the service role key.

3. Run database migrations in Supabase **SQL Editor** (in order):
   - `supabase/migrations/20260329000000_profiles.sql` (Phase 1)
   - `supabase/migrations/20260329120000_phase2_student_fields.sql` (Phase 2 — school, major, graduation year)
   - `supabase/migrations/20260329203000_campaigns.sql` (Phase 3 — campaign drafts)
   - `supabase/migrations/20260329210000_campaign_run_progress.sql` (Phase 4 — run progress columns)
   - `supabase/migrations/20260329220000_candidates.sql` (Phase 5 — mock candidate list + RLS)

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run start`| Production server  |
| `npm run lint` | ESLint             |

## Deploy to Vercel

**Project ID** (dashboard / support / CLI): `prj_Uy6TxtvfTGG1MlJ5DTgEqQ1oon1F`  
Stored in [`.vercel/project.json`](.vercel/project.json) for `vercel` CLI. If the CLI asks for a **Team / Org ID**, run `vercel link` from `web/` once or copy it from Vercel → Team Settings. **Production URL and 404s are controlled in the Vercel dashboard** (Deployments, domain, root directory)—the project ID alone does not change routing.

1. Push this repo to GitHub (this folder can live as the repo root or as a monorepo subfolder).
2. [Import the project](https://vercel.com/new) in Vercel.
3. If the Next app lives in `web/`, set **Root Directory** to `web` in Vercel project settings.
4. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (server-only; for campaign extraction)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; for Phase 4 run pipeline updates)
5. Add your Vercel URL(s) to Supabase **Authentication → URL Configuration → Redirect URLs** (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)).

## Security notes

- The **anon** key is safe to expose in the browser; it is restricted by Row Level Security.
- Do **not** put the **service role** key in client code or `NEXT_PUBLIC_*` variables.

## Related docs

- [PROJECT_SPEC_FROM_INTERVIEW.md](../PROJECT_SPEC_FROM_INTERVIEW.md)
- [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md)
