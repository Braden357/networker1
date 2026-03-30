import { createServiceRoleClient } from "@/lib/supabase/service";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stub async pipeline: discover → rank → research → draft.
 * Phase 5 replaces discovery/ranking with real data; Phase 7 adds drafts per candidate.
 * Updates rows via service role so it can run after the HTTP response (no user cookies).
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
      run_progress: 12,
      run_error: null,
    });
    await sleep(900);

    await patch({
      run_step: "rank",
      run_progress: 38,
    });
    await sleep(900);

    await patch({
      run_step: "research",
      run_progress: 64,
    });
    await sleep(900);

    await patch({
      run_step: "draft",
      run_progress: 88,
    });
    await sleep(700);

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
