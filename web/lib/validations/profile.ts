import { z } from "zod";

export const profileFormSchema = z
  .object({
    school: z
      .string()
      .trim()
      .min(1, "School is required")
      .max(200, "School name is too long"),
    graduation_year: z.coerce
      .number({ error: "Enter a graduation year" })
      .int()
      .min(1950, "Year seems too early")
      .max(2040, "Year seems too far in the future"),
    major: z
      .string()
      .trim()
      .min(1, "Major is required")
      .max(200, "Major is too long"),
    linkedin_profile_url: z.string().max(500).default(""),
  })
  .superRefine((data, ctx) => {
    const s = data.linkedin_profile_url.trim();
    if (s === "") return;
    let url: URL;
    try {
      url = new URL(s);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid URL",
        path: ["linkedin_profile_url"],
      });
      return;
    }
    if (!url.hostname.toLowerCase().endsWith("linkedin.com")) {
      ctx.addIssue({
        code: "custom",
        message: "Use a LinkedIn URL (linkedin.com)",
        path: ["linkedin_profile_url"],
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export type FieldErrors = Partial<
  Record<keyof ProfileFormValues, string[]>
> & {
  form?: string[];
};

export type ParsedProfileForSave = Omit<
  ProfileFormValues,
  "linkedin_profile_url"
> & { linkedin_profile_url: string | null };

export function parseProfileForm(formData: FormData): {
  ok: true;
  data: ParsedProfileForSave;
} | {
  ok: false;
  error: FieldErrors;
} {
  const raw = {
    school: formData.get("school"),
    graduation_year: formData.get("graduation_year"),
    major: formData.get("major"),
    linkedin_profile_url: formData.get("linkedin_profile_url"),
  };

  const result = profileFormSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (
        key === "school" ||
        key === "graduation_year" ||
        key === "major" ||
        key === "linkedin_profile_url"
      ) {
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key]!.push(issue.message);
      }
    }
    return { ok: false, error: fieldErrors };
  }

  const linkedin = result.data.linkedin_profile_url.trim();
  return {
    ok: true,
    data: {
      school: result.data.school,
      graduation_year: result.data.graduation_year,
      major: result.data.major,
      linkedin_profile_url: linkedin === "" ? null : linkedin,
    },
  };
}
