"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type FieldErrors,
  parseProfileForm,
} from "@/lib/validations/profile";

export type ProfileActionState = {
  error: FieldErrors | null;
  success: boolean;
};

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = parseProfileForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: { form: ["Not signed in"] },
      success: false,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      school: parsed.data.school,
      graduation_year: parsed.data.graduation_year,
      major: parsed.data.major,
      linkedin_profile_url: parsed.data.linkedin_profile_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      error: { form: [error.message] },
      success: false,
    };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}
