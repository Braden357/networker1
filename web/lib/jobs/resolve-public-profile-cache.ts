import type { SupabaseClient } from "@supabase/supabase-js";
import type { RankedCandidateInsert } from "@/lib/discovery/rank-candidates";
import { researchProfileCard } from "@/lib/llm/research-profile-card";
import { isPublicProfileCacheStale } from "@/lib/profile/cache-stale";
import { canonicalizeLinkedInProfileUrl } from "@/lib/profile/canonicalize-linkedin-url";
import type { ExtractedParameters } from "@/lib/validations/campaign";
import type { ResearchArtifact } from "@/lib/validations/research-artifact";

function logCacheEvent(payload: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      component: "public_profile_cache",
      ts: new Date().toISOString(),
      ...payload,
    }),
  );
}

/**
 * Returns public_profile_cache row id. Reuses fresh cache rows (no LLM); otherwise upserts via service role.
 */
export async function resolvePublicProfileCache(
  supabase: SupabaseClient,
  ranked: RankedCandidateInsert,
  params: ExtractedParameters,
  studentSchool: string | null,
): Promise<string> {
  const canonical = canonicalizeLinkedInProfileUrl(ranked.profile_url);

  const { data: existing, error: selErr } = await supabase
    .from("public_profile_cache")
    .select("id, last_fetched_at")
    .eq("canonical_profile_url", canonical)
    .maybeSingle();

  if (selErr) {
    throw new Error(selErr.message);
  }

  if (existing && !isPublicProfileCacheStale(existing.last_fetched_at)) {
    logCacheEvent({
      event: "cache_hit",
      canonical_profile_url: canonical,
      cache_id: existing.id,
    });
    return existing.id;
  }

  logCacheEvent({
    event: existing ? "cache_miss_stale" : "cache_miss",
    canonical_profile_url: canonical,
    cache_id: existing?.id ?? null,
  });

  const artifact: ResearchArtifact = await researchProfileCard({
    displayName: ranked.display_name,
    headline: ranked.headline,
    canonicalProfileUrl: canonical,
    params,
    studentSchool,
  });

  const { data: upserted, error: upErr } = await supabase
    .from("public_profile_cache")
    .upsert(
      {
        canonical_profile_url: canonical,
        last_fetched_at: new Date().toISOString(),
        display_name: ranked.display_name,
        headline: ranked.headline,
        research_artifact: artifact,
      },
      { onConflict: "canonical_profile_url" },
    )
    .select("id")
    .single();

  if (upErr || !upserted?.id) {
    throw new Error(upErr?.message ?? "public_profile_cache upsert failed");
  }

  return upserted.id;
}
