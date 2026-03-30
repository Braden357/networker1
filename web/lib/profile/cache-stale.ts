import { PUBLIC_PROFILE_CACHE_TTL_MS } from "@/lib/discovery/constants";

export function isPublicProfileCacheStale(lastFetchedAt: string): boolean {
  const t = new Date(lastFetchedAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t >= PUBLIC_PROFILE_CACHE_TTL_MS;
}
