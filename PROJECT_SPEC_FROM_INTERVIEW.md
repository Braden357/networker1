# Project specification (from technical interview)

This document captures decisions from the structured interview (**Rounds 1–3** and **Round 4** clarifications on LinkedIn storage, retention, caps, and cost). It describes product intent and implementation direction. **First shipped version = MVP** (minimum viable product); earlier drafts used “MDP” interchangeably.

---

## 1. Project overview and goals

### One-liner

A **web application for college students** that helps them **network in a chosen niche**, **research** plausible contacts, and **draft / queue outreach** so they can **increase coffee-chat–style conversations** and learn about industries—without accepting **unacceptable LinkedIn account ban risk**.

### Primary success metric

- **North star:** More **coffee-chat outcomes**, defined as a **positive reply** and **continued conversation** in the thread.  
- A physical or virtual meeting is **optional** and left to the user; the product’s job is largely done at **reply + ongoing dialogue**.

### Non-goals (implicit from interview)

- Replacing the student’s judgment entirely on who to contact.  
- Guaranteeing referrals or jobs.  
- Maximizing connection count as the main KPI.

---

## 2. Audience and positioning

| Topic | Decision |
|--------|-----------|
| **Primary users** | **College students** (this version is **not** aimed at alumni, bootcamp grads, or career switchers as first-class on day one). |
| **Tone** | **Pure professional** in all generated outreach and UI copy. |
| **Business model** | **Free MVP** first; **paid tier later** (faster runs, paid APIs / stronger LLM, more profiles/month, deeper research—details TBD). |
| **Platform** | **Web-only** for constraints discussed so far. |
| **Timeline** | **No fixed deadline.** |

---

## 3. Core user experience

### Entry and parameters

- On opening the app, the user is met with a **text box** (prompt) where they describe what they want (niche, geography, goals, etc.).
- The system should **extract parameters** from that text and present an **editable checklist** so the user can correct or refine before running the workflow.
- After the user submits the finalized checklist, the app moves to a **“we’re working”** style **progress** experience while work runs.

### Parameter areas (draft list from interview)

These are the kinds of fields the product should infer or let the user edit:

| Area | Examples |
|------|-----------|
| Geography | City/region (e.g. San Diego), remote vs local |
| Role / function | e.g. corporate finance, FP&A |
| Industry | e.g. tech, biotech (multi-select) |
| Seniority | e.g. entry–mid; specific titles |
| Target personas | Alumni, analysts, interns (see “good connection” below) |
| Companies | Inclusions/exclusions, dream employers |
| Student context | School, major, graduation year—used for credibility in drafts and alumni matching |
| Outreach intent | Informational / coffee chat / path-to-role learning (worded carefully, no misleading claims) |
| Volume / pace | **~50 suggested people per run** (cap); **~2 runs per week** per user (MVP starting point for cost + abuse control); tune after usage |
| Language | Assumed **English** unless stated otherwise later |

---

## 4. What makes a “good connection”

**Priority signals (high level):**

1. **Alumni of the student’s school** should rank **high** in the suggestion list.  
2. **Current entry-level titles** appropriate to the niche (e.g. **financial analyst** for corporate finance).  
3. **Interns** matter for younger students (e.g. **sophomores** seeking advice on **how to land an internship** at a company)—so interns are valid targets when that matches the user’s goal.

**Discovery:**

- **LinkedIn search / results** are a good source.  
- **Any public sources** that improve targeting, research, or draft quality are in scope (company sites, job boards, news, etc.), subject to **lawful** use and **platform terms** in implementation.

---

## 5. Research depth

- **Philosophy:** “The more information, the better” for **surfacing and drafting**—you did not ask for a minimal research card.  
- **Reality check for implementation:** Data must still come from **allowed** sources; “more data” does not override scraping or ToS where they forbid certain uses. The spec treats **rich context** as the product goal; engineering will map that to compliant sources.

---

## 6. Automation, safety, and guardrails

### Automation stance

- **As automated as possible** without **unacceptable ban risk** (you were explicit that **ban risk is unacceptable**).  
- This implies a practical split: **heavy automation** on **shortlisting, research synthesis, drafts, scheduling reminders, and queueing**; **careful** handling of anything LinkedIn treats as sensitive (rate limits, repetitive behavior, bulk identical sends).

### Copy and templates

- **Light product guardrails:** You’re OK with **semi-generic** messages if they perform; **mass identical** blasts are **not ideal** but you’re **not** asking for heavy moral or content blocking.  
- **Platform reality:** Spam detection may still force **variation**, **throttling**, or **human confirmation** on certain steps—the product should be designed to **survive** that tension without promising full unsupervised blasting.

### Coffee chat “done”

- Success = **positive response** + **continued conversation**. No requirement to integrate calendar for v1 unless you add it later.

---

## 7. Business and product phases

| Phase | Intent |
|--------|--------|
| **MVP** | **Free** version: email/password auth, persisted data, **LinkedIn profile URL** on the user record; **OAuth** optional until API features need it; **draft-only** outbound (user sends in LinkedIn). **Private demo:** password reset via **manual admin**. |
| **Later** | **Paid** tier (Stripe TBD): faster processing, **paid APIs** / **better LLM**, **higher monthly profile limits**, **deeper research**; self-service password reset as needed. |

---

## 8. Technical and operational notes from interview

- **API keys:** You’re open to using providers (e.g. you mentioned something like **“API fi”**—commonly **Apify** or similar) where useful; treat as **optional infrastructure** for public-data workflows.  
- **Hosting / stack (Round 3):** **Vercel** (frontend + serverless API routes) + **Supabase** (Postgres, auth, RLS) — see **§11** for rationale and alternatives.

---

## 9. Round 3 — decisions (locked)

| Topic | Decision |
|--------|-----------|
| **Student profile** | **Manual entry** (school, graduation year, major, etc.) for alumni matching in MVP. |
| **Outbound messaging (MVP)** | **No server-side send.** User gets **drafts** and **taps Send** in LinkedIn. |
| **Auth** | **Not** `.edu`-only. MVP collects **email + password** so users can log in and **persist** campaigns and profile; **security is a first-class requirement** (hashed passwords via provider, HTTPS, secrets hygiene). |
| **LinkedIn** | Store **user’s LinkedIn profile URL**; add **OAuth + server-side token storage** only when implementing **official API** features that require it—**not** for automated messaging from backend in MVP. |
| **MVP slice** | **~50 suggested people** per run (cap); rank with **school alumni first** (early interview had “LMI”—read as **alumni**). |
| **Geography** | **US-only** for MVP (copy, time zones, market defaults). |
| **Infra preference** | **Vercel + Supabase** (user-aligned); see **§11** for recommendation. |
| **Paid tier (direction)** | **Faster** runs; **paid/better APIs** and **stronger LLM**; **more profiles/month**; **deeper research**—exact packaging **TBD**. |

---

## 10. Round 4 — LinkedIn identity, auth ops, retention, usage caps, cost

### Round 4 decisions (locked)

| Topic | Decision |
|--------|-----------|
| **Password reset** | **Manual admin reset** is acceptable for a **private demo**; self-service forgot-password can ship later. |
| **Payments** | **Not in scope** for now. **Stripe** (or similar) is a likely default when a paid tier exists; **request access / manual onboarding** is fine early. |
| **User data + “link to LinkedIn”** | The database holds **user profile fields** (school, major, etc.) plus a **LinkedIn profile URL** for the student. **OAuth tokens** are separate—only required when the backend calls **LinkedIn APIs** on behalf of that user (see below). |
| **Token storage** (when OAuth exists) | **Access/refresh tokens live only on the server** (encrypted at rest, never exposed to the browser). The client never holds long-lived LinkedIn secrets. |
| **Candidate (target) profiles** | Store **public profile URLs** + **research** + **derived summaries**—**CRM-style** rows, not “login as candidate.” |
| **Data retention** | **Indefinite retention** is intended so the system can maintain a **shared cache** of **public** profile enrichment: when **another user** runs a similar search, the app can **reuse** work already done—**lower cost**, **consistent** facts. Implementation must still respect **platform terms** and a clear **privacy policy**. |
| **Usage caps (MVP)** | **~50 people per run**; **~2 runs per week** per user (starting point); adjust with telemetry. |

### Two different “LinkedIn” concepts

| Concept | Typical storage | Role |
|--------|------------------|------|
| **The logged-in student’s LinkedIn** | **Profile URL** (always useful for display and deep links). **OAuth tokens** only if you integrate **official LinkedIn APIs** that require them. | Tokens prove the user **authorized** the app within specific **scopes**—they are **secrets**, like passwords. |
| **People you want to contact (candidates)** | **LinkedIn URL** + **research text** + optional **shared cached** enrichment. | You are **not** authenticating as these people; you are storing **targets** and **notes**. |

### What “token storage” means (plain language)

If you add **“Connect LinkedIn”** with **OAuth**, LinkedIn sends **access** (and usually **refresh**) **tokens** to your **backend** after the user approves. **Token storage** means **where** you save those strings so your server can **refresh** API access without asking the user to reconnect—**only on the server**, using your auth provider’s or DB **encryption** patterns.

### MVP pragmatism

- **Minimum:** **Email + password**, **student profile** in Postgres, **campaigns**, **candidates** with **URLs + drafts + research**.  
- **If** MVP only needs the student’s **public profile link** for UI and **no** LinkedIn API calls: storing the **URL** may be enough **without** OAuth in v1.  
- **Add OAuth + server-side tokens** when you implement features that **require** LinkedIn’s official APIs.

### Shared profile cache (cross-user)

**Intent:** Deduplicate by **canonical public profile URL** (or stable id) so **enrichment** (LLM summaries, fetched public facts) is **stored once** and **reused** across users and campaigns—**cheaper** and **less redundant** than reprocessing every run.

**Guardrails:** Respect **LinkedIn** (and other) **terms** for how data is **obtained** and **retained**; document in a **privacy policy** what is stored and why; avoid presenting **non-public** data as if it were public.

### Operating cost (ballpark, not a quote)

Assumptions: **Vercel + Supabase** free/low tiers, **private beta**, **~50 candidates × ~2 runs/week**, moderate LLM usage.

| Piece | Order of magnitude |
|--------|---------------------|
| **Vercel** (hobby) | Often **$0** at first |
| **Supabase** | Often **$0–25/mo** as data and auth traffic grow |
| **LLM** | Often **tens of USD/month** for a small beta if models and context are **controlled**; can **rise sharply** with large context windows, premium models, or uncapped usage |
| **Apify / third-party fetch** (if used) | **$0–50+/mo** depending on volume |
| **Main budget risk** | **Unbounded LLM calls**—mitigate with **per-run caps**, **weekly limits**, and **monitoring** |

The **50/run** and **2/week** limits are partly to keep costs **predictable** and reduce spam-like behavior.

---

## 11. Tech stack and architecture

**Recommendation (aligned with your lean):** **Next.js on Vercel** + **Supabase**.

- **Why it fits:** One **TypeScript** stack, **serverless** APIs on Vercel, **Supabase Auth** handles **email/password** safely (no home-grown crypto), **Postgres** with **Row Level Security** for multi-tenant data, storage if you add exports later. Good fit for a **solo/small** team and **free tier** costs.
- **Caveat:** Long **research jobs** may exceed **serverless timeouts**—use a **job queue** (e.g. **Inngest**, **Trigger.dev**, **Supabase Edge Functions** + `pg_cron`, or a small **worker** on **Railway/Fly** for heavy steps). Plan **async**: user sees **progress** while workers run.
- **Alternatives:** **Neon** + **Clerk** (auth) + Vercel if you want auth UI out of the box; **Railway** all-in-one if you prefer **one long-running Node** service and fewer moving parts—tradeoff is more ops. **Vercel + Supabase** remains a strong default for this MVP.

**Concrete sketch:**

- **Client:** Next.js (App Router), server components where useful.  
- **API:** Route Handlers or tRPC; **service role** only on server.  
- **DB:** Supabase Postgres — users, student profiles, campaigns, candidates, drafts, job status.  
- **Auth:** Supabase Auth (email/password); optional **Google** OAuth later.  
- **LinkedIn:** **Profile URL** on user record; **OAuth** + **encrypted** token storage when API integration ships; **no** auto-send in MVP.  
- **LLM / tools:** OpenAI or similar from **server only**; API keys in **env**, never client.  
- **Integrations:** Public sources + optional Apify; comply with ToS.

---

## 12. Data model (high level)

Entities (evolve in implementation):

- **User** — id, email (auth), created_at; **linkedin_profile_url** (student’s own public URL); optional **OAuth** fields (provider user id, **encrypted** token refs) **only if** LinkedIn API integration is enabled.  
- **StudentProfile** — school name, graduation year, major (manual MVP), optional extras.  
- **Campaign** — user id, raw prompt, status (`draft` / `running` / `complete` / `failed`).  
- **ExtractedParameters** — json snapshot after user edits checklist (version per run).  
- **PublicProfileCache** (or equivalent) — **normalized public profile URL** (or stable id), **shared** enrichment (summaries, source refs, `last_fetched_at`) for **cross-user reuse** per Round 4.  
- **Candidate** — campaign id, **fk** to `PublicProfileCache` or duplicate URL key, display fields, **alumni_score**, per-campaign ranking.  
- **ResearchArtifact** — may attach to **cache** and/or **candidate** depending on whether text is shared or user-specific.  
- **DraftMessage** — candidate id, type (`connection_note` / `first_dm` / follow-up), body, user edits.  
- **OutreachState** — optional tracking: `drafted` / `copied` / user-marked **replied** (honor system or manual).

---

## 13. UI/UX requirements

- **Screen 1:** Large prompt text box on open.  
- **Screen 2:** Editable checklist of extracted parameters + confirm.  
- **Screen 3+:** Progress during processing; then results (ranked list, research, drafts, queue).  
- **Tone:** Professional throughout.

---

## 14. API and integration points

- **LLM** — extraction, summarization, drafting (server-side; **paid tier** may upgrade model).  
- **Apify / similar** — optional public-page enrichment.  
- **Job boards / careers pages** — public listings for context.  
- **LinkedIn** — **OAuth** link; use **official** APIs only for permitted operations; **no** backend message send in MVP. Search/discovery details subject to **LinkedIn product access**—may combine with **non-LinkedIn** public discovery + manual match.

---

## 15. Deployment and infrastructure

- **Vercel** — app + previews; **Supabase** — DB + auth (separate project for prod).  
- **Secrets** — Vercel env + Supabase dashboard; never commit keys.  
- **Rate limiting** — per user/IP on expensive routes (LLM, search); enforce **MVP caps** (~**50** per run, ~**2 runs/week** per user) in application logic.  
- **Backups** — Supabase automated backups (plan-dependent).  
- **Observability** — structured logs for job failures and LLM errors.

---

## 16. Edge cases and error handling (principles)

- **Rate limits:** External APIs and any LinkedIn-surface actions must respect limits; user-visible **retry** and **backoff**.  
- **Empty results:** Clear messaging when no good fits are found; suggest broadening parameters.  
- **Partial data:** Research cards should show **confidence** or **missing fields** where useful.  
- **Account health:** Product should **avoid** patterns that correlate with restrictions (documented in runbooks, not necessarily user-facing lecture).

---

## 17. MVP scope vs future features

| MVP (Rounds 3–4) | Future |
|-----------------|--------|
| Free, web, US-only, email/password, data persisted | Paid: faster queue, better LLM, more profiles/mo, deeper research |
| User’s **LinkedIn URL** in DB; **OAuth/tokens** when API features need them; **drafts only** (user sends) | Full self-service password reset, Stripe |
| **~50/run**, **~2/week**, alumni-first ranking | International markets |
| **Indefinite** retention + **shared public-profile cache** | Broader personas (non-students) if you expand |
| Prompt → checklist → progress → results | Calendar hooks, `.edu` verification, org licenses (speculative) |

---

## 18. How you want the project completed (process)

Based on the interview:

1. **Do not skip the parameter checklist**—implementation should mirror **prompt → extract → user edit → run**.  
2. **Prioritize alumni and role-appropriate junior titles** in ranking logic.  
3. **Invest in research richness** where data is legally and practically available.  
4. **Automate aggressively** in the product, but **design for ban-risk minimization** on LinkedIn-touching behavior (likely confirmation or official paths for sensitive actions).  
5. **Ship a free MVP** first; **defer monetization** until the core loop works.  
6. **Security:** treat auth, **optional OAuth tokens**, and PII seriously (Supabase RLS, HTTPS, no client secrets).  
7. **Shared cache:** implement **PublicProfileCache** (or equivalent) for **deduplication** and cost control; document **retention** in privacy policy.  
8. **Enforce** MVP **usage caps** in app logic, not only in docs.

---

*Generated from the technical interview. Revise when LinkedIn API scopes and legal review are finalized.*

