import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  insertCandidatesForCampaign,
  prepareRankedCandidatesForCampaign,
} from "@/lib/jobs/materialize-candidates";
import { resolvePublicProfileCache } from "@/lib/jobs/resolve-public-profile-cache";
import type { CandidateInsertRow } from "@/lib/jobs/materialize-candidates";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Async pipeline: discover → rank → research (cache + LLM) → draft stub → done.
 * Service role updates campaigns and writes cache/candidates after HTTP returns.
 */
export async function runCampaignPipeline(campaignId: string) {
  const supabase = createServiceRoleClient();

  const patch = async (values: Record<string, unknown>) => {
    const { error } = await supabase
      .from("campaigns")
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (error) {
      throw new Error(error.message);
    }
  };

  try {
    await patch({
      run_step: "discover",
      run_progress: 8,
      run_error: null,
    });

    const { ranked, extractedParameters, studentSchool } =
      await prepareRankedCandidatesForCampaign(supabase, campaignId);

    await patch({
      run_step: "rank",
      run_progress: 35,
    });

    await patch({
      run_step: "research",
      run_progress: 35,
    });

    const n = ranked.length;
    const withCache: CandidateInsertRow[] = [];

    for (let i = 0; i < n; i++) {
      const r = ranked[i];
      const cacheId = await resolvePublicProfileCache(
        supabase,
        r,
        extractedParameters,
        studentSchool,
      );
      withCache.push({ ...r, public_profile_cache_id: cacheId });

      const researchProgress =
        n > 0 ? 35 + Math.round(((i + 1) / n) * (62 - 35)) : 62;
      await patch({
        run_step: "research",
        run_progress: Math.min(62, researchProgress),
      });
    }

    await insertCandidatesForCampaign(supabase, campaignId, withCache);

    await patch({
      run_step: "draft",
      run_progress: 86,
    });
    await sleep(500);

    await patch({
      run_step: "done",
      run_progress: 100,
      status: "complete",
      run_completed_at: new Date().toISOString(),
      run_error: null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Run failed";
    await supabase
      .from("campaigns")
      .update({
        status: "failed",
        run_step: "failed",
        run_error: message,
        run_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
  }
}
