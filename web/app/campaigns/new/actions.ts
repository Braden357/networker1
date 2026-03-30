"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractCampaignParameters } from "@/lib/llm/extract-parameters";
import { rawPromptSchema } from "@/lib/validations/campaign";

export type PromptActionState = {
  error: string | null;
};

export async function submitCampaignPrompt(
  _prev: PromptActionState,
  formData: FormData,
): Promise<PromptActionState> {
  const raw = formData.get("prompt");
  const parsedPrompt = rawPromptSchema.safeParse(
    typeof raw === "string" ? raw : "",
  );
  if (!parsedPrompt.success) {
    const msg = parsedPrompt.error.issues[0]?.message ?? "Invalid prompt.";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  let extracted;
  try {
    extracted = await extractCampaignParameters(parsedPrompt.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Extraction failed.";
    return { error: msg };
  }

  const { data: row, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      raw_prompt: parsedPrompt.data,
      extracted_parameters: extracted,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !row) {
    return { error: error?.message ?? "Could not save campaign." };
  }

  revalidatePath("/dashboard");
  redirect(`/campaigns/${row.id}/checklist`);
}
