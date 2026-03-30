/** Max candidates materialized per campaign run (spec §9, §15). */
export const MAX_CANDIDATES_PER_RUN = 50;

/** MVP default: max completed runs per user per rolling 7 days (spec §15). */
const DEFAULT_MAX_COMPLETED_RUNS_PER_WEEK = 2;

/**
 * Same cap as `DEFAULT_MAX_COMPLETED_RUNS_PER_WEEK` unless `MVP_MAX_COMPLETED_RUNS_PER_WEEK`
 * is set in server env (for local testing). Do not set that var in production unless you intend to relax the cap.
 */
export function getMaxCompletedRunsPerWeek(): number {
  const raw = process.env.MVP_MAX_COMPLETED_RUNS_PER_WEEK?.trim();
  if (!raw) {
    return DEFAULT_MAX_COMPLETED_RUNS_PER_WEEK;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_MAX_COMPLETED_RUNS_PER_WEEK;
  }
  return Math.min(n, 100);
}

/** Reuse public_profile_cache rows without re-calling the research LLM (Phase 6). */
export const PUBLIC_PROFILE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
