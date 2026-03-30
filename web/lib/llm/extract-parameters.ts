import OpenAI from "openai";
import {
  extractedParametersSchema,
  type ExtractedParameters,
} from "@/lib/validations/campaign";

const ARRAY_KEYS = [
  "industries",
  "target_personas",
  "companies_include",
  "companies_exclude",
] as const;

/** Coerce common LLM mistakes (string instead of string[]) before Zod. */
function normalizeLlmPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const o = { ...(raw as Record<string, unknown>) };
  for (const key of ARRAY_KEYS) {
    const v = o[key];
    if (typeof v === "string") {
      o[key] = v
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (v == null) {
      o[key] = [];
    }
  }
  return o;
}

const SYSTEM = `You are extracting structured networking campaign parameters from a student's free-text description.
Return a single JSON object with exactly these keys (no markdown, no commentary):
- geography: string — city, region, or "United States" scope as implied (MVP is US-focused).
- remote_preference: one of "local", "remote", "either"
- role_function: string — target role or function (e.g. corporate finance, FP&A)
- industries: string[] — short labels (e.g. "tech", "biotech"); empty array if unknown
- seniority: string — e.g. entry-level to mid, or titles sought
- target_personas: string[] — e.g. "alumni", "analysts", "interns"
- companies_include: string[] — dream employers or must-include companies; [] if none stated
- companies_exclude: string[] — companies to avoid; [] if none stated
- outreach_intent: string — informational / coffee chat / learning path (professional wording)
- language: string — default "English" unless user asks otherwise

Infer reasonably from context; use conservative empty arrays when not specified. Keep strings concise.`;

/**
 * Calls OpenAI from the server only. Do not log the user's prompt in production.
 */
export async function extractCampaignParameters(
  rawPrompt: string,
): Promise<ExtractedParameters> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OpenAI is not configured. Add OPENAI_API_KEY to the server environment.",
    );
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: rawPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("The model returned an empty response. Try again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("The model returned invalid JSON. Try again.");
  }

  const result = extractedParametersSchema.safeParse(normalizeLlmPayload(parsed));
  if (!result.success) {
    throw new Error(
      "The model output did not match the expected shape. Edit the checklist manually after continuing, or try a clearer prompt.",
    );
  }

  return result.data;
}
