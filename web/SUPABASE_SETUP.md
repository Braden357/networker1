# Supabase setup (Phase 1)

## 1. Create a project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a project.
2. Wait for the database to finish provisioning.

## 2. Enable email/password auth

1. **Authentication** → **Providers** → **Email**.
2. Enable **Email** provider.
3. For local development, you can turn **Confirm email** off (or use **Auto Confirm** in development) so sign-up works without clicking a link. Tighten this before a public launch.

## 3. URLs and redirects

1. **Authentication** → **URL Configuration**.
2. **Site URL**: `http://localhost:3000` for local dev; your production URL (e.g. `https://your-app.vercel.app`) when deployed.
3. **Redirect URLs** — add:
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
   - Your Vercel production URL: `https://<project>.vercel.app/**`
   - Optional: wildcard for previews if your Supabase plan supports it, e.g. `https://*.vercel.app/**`

OAuth and magic-link flows use `/auth/callback`; keep that path allowed.

## 4. API keys

1. **Project Settings** → **API**.
2. Copy **Project URL** and **anon public** key into `web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Never commit `.env.local`. Use [`.env.example`](.env.example) as a template.

## 5. Database migration

Apply the SQL in [`supabase/migrations/20260329000000_profiles.sql`](supabase/migrations/20260329000000_profiles.sql):

- Open **SQL Editor** in Supabase, paste the file contents, and run; or  
- Use the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase db push` (with project linked).

This creates `public.profiles`, RLS policies, and a trigger to insert a profile row when a user signs up.

### Phase 2 (student fields)

Run the SQL in [`supabase/migrations/20260329120000_phase2_student_fields.sql`](supabase/migrations/20260329120000_phase2_student_fields.sql) the same way (`school`, `graduation_year`, `major` on `profiles`).

## 6. Password reset (MVP)

Phase 1 assumes **manual admin reset** for a private demo. In Supabase you can reset a user’s password from **Authentication** → **Users** (or via SQL). Add self-service reset later if needed.
