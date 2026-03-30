import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_CANDIDATES_PER_RUN } from "@/lib/discovery/constants";
import { buildMockCandidateSeeds } from "@/lib/discovery/mock-seed";
import {
  rankMockCandidates,
  type RankedCandidateInsert,
} from "@/lib/discovery/rank-candidates";
import {
  extractedParametersSchema,
  type ExtractedParameters,
} from "@/lib/validations/campaign";

export type RankedCampaignContext = {
  ranked: RankedCandidateInsert[];
  extractedParameters: ExtractedParameters;
  studentSchool: string | null;
};

/**
 * Loads campaign + profile, clears old candidates, builds ranked mock list (Phase 5–6 discover/rank).
 * Does not insert candidates — research step resolves cache then bulk-inserts.
 */
export async function prepareRankedCandidatesForCampaign(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<RankedCampaignContext> {
  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .select("user_id, extracted_parameters")
    .eq("id", campaignId)
    .maybeSingle();

  if (cErr || !campaign?.extracted_parameters) {
    throw new Error(cErr?.message ?? "Campaign or parameters missing");
  }

  const parsed = extractedParametersSchema.safeParse(campaign.extracted_parameters);
  if (!parsed.success) {
    throw new Error("Invalid extracted_parameters on campaign");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school")
    .eq("id", campaign.user_id)
    .maybeSingle();

  await supabase.from("candidates").delete().eq("campaign_id", campaignId);

  const seeds = buildMockCandidateSeeds(
    MAX_CANDIDATES_PER_RUN,
    profile?.school ?? null,
  );
  const ranked = rankMockCandidates(
    seeds,
    parsed.data,
    profile?.school ?? null,
  );

  return {
    ranked,
    extractedParameters: parsed.data,
    studentSchool: profile?.school ?? null,
  };
}

export type CandidateInsertRow = RankedCandidateInsert & {
  public_profile_cache_id: string;
};

export async function insertCandidatesForCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  rows: CandidateInsertRow[],
) {
  const payload = rows.map((r) => ({
    campaign_id: campaignId,
    rank_order: r.rank_order,
    display_name: r.display_name,
    headline: r.headline,
    profile_url: r.profile_url,
    source_label: r.source_label,
    alumni_score: r.alumni_score,
    alumni_note: r.alumni_note,
    fit_score: r.fit_score,
    public_profile_cache_id: r.public_profile_cache_id,
  }));

  const { error: insErr } = await supabase.from("candidates").insert(payload);
  if (insErr) {
    throw new Error(insErr.message);
  }
}
