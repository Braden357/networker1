"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseChecklistForm } from "@/lib/validations/campaign";

export type ChecklistActionState = {
  error: string | null;
  success: boolean;
};

export async function saveCampaignChecklist(
  _prev: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const campaignId = formData.get("campaign_id");
  if (typeof campaignId !== "string" || !campaignId) {
    return { error: "Missing campaign.", success: false };
  }

  const parsed = parseChecklistForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in.", success: false };
  }

  const { error } = await supabase
    .from("campaigns")
    .update({
      extracted_parameters: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/campaigns/${campaignId}/checklist`);
  return { error: null, success: true };
}
