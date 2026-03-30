import { z } from "zod";

export const RAW_PROMPT_MAX = 6000;
export const RAW_PROMPT_MIN = 20;

export const rawPromptSchema = z
  .string()
  .trim()
  .min(
    RAW_PROMPT_MIN,
    "Describe your goals in at least a few sentences (minimum 20 characters).",
  )
  .max(RAW_PROMPT_MAX, `Prompt is too long (max ${RAW_PROMPT_MAX} characters).`);

export const remotePreferenceSchema = z.enum(["local", "remote", "either"]);

export const extractedParametersSchema = z.object({
  geography: z.string().trim().min(1).max(500),
  remote_preference: remotePreferenceSchema.default("either"),
  role_function: z.string().trim().min(1).max(500),
  industries: z.array(z.string().trim().max(100)).max(20).default([]),
  seniority: z.string().trim().min(1).max(300),
  target_personas: z.array(z.string().trim().max(200)).max(30).default([]),
  companies_include: z.array(z.string().trim().max(200)).max(50).default([]),
  companies_exclude: z.array(z.string().trim().max(200)).max(50).default([]),
  outreach_intent: z.string().trim().min(1).max(500),
  language: z.string().trim().max(50).default("English"),
});

export type ExtractedParameters = z.infer<typeof extractedParametersSchema>;

function linesToArray(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseChecklistForm(formData: FormData): {
  ok: true;
  data: ExtractedParameters;
} | {
  ok: false;
  error: string;
} {
  const remote = formData.get("remote_preference");
  const remoteParsed = remotePreferenceSchema.safeParse(remote);
  if (!remoteParsed.success) {
    return { ok: false, error: "Choose a work location preference." };
  }

  const raw = {
    geography: String(formData.get("geography") ?? "").trim(),
    remote_preference: remoteParsed.data,
    role_function: String(formData.get("role_function") ?? "").trim(),
    industries: linesToArray(String(formData.get("industries") ?? "")),
    seniority: String(formData.get("seniority") ?? "").trim(),
    target_personas: linesToArray(String(formData.get("target_personas") ?? "")),
    companies_include: linesToArray(
      String(formData.get("companies_include") ?? ""),
    ),
    companies_exclude: linesToArray(
      String(formData.get("companies_exclude") ?? ""),
    ),
    outreach_intent: String(formData.get("outreach_intent") ?? "").trim(),
    language: String(formData.get("language") ?? "English").trim() || "English",
  };

  const result = extractedParametersSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "Invalid checklist values.",
    };
  }

  return { ok: true, data: result.data };
}
