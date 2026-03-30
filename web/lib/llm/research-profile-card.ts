import OpenAI from "openai";
import type { ExtractedParameters } from "@/lib/validations/campaign";
import {
  researchArtifactSchema,
  type ResearchArtifact,
} from "@/lib/validations/research-artifact";

const SYSTEM = `You help college students research people they may network with. The input is MOCK or public-style profile hints only — not a live LinkedIn fetch. Never claim you verified employment or education.

Return a single JSON object with exactly these keys (no markdown):
- summary: string — 2–4 sentences, professional, cautious wording ("may", "appears to align with").
- bullets: string[] — up to 6 short bullets (role fit, geography, seniority, conversation hooks). Empty array only if truly nothing to say.
- confidence: one of "low", "medium", "high" — how much the hints support the summary (usually low/medium for mock data).
- gaps: optional string — what is missing compared to an ideal research card.
- disclaimer: optional string — one line for UI, e.g. synthesized from limited mock/public-style inputs.
- sources_note: optional string — note that this is not from scraped private data.

Be concise. Output valid JSON only.`;

function normalizeBullets(raw: unknown): unknown {
  if (typeof raw === "string") {
    return raw
      .split(/[\n•]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw;
}

function normalizePayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const o = { ...(raw as Record<string, unknown>) };
  o.bullets = normalizeBullets(o.bullets);
  return o;
}

export type ResearchProfileCardInput = {
  displayName: string;
  headline: string;
  canonicalProfileUrl: string;
  params: ExtractedParameters;
  studentSchool: string | null;
};

/**
 * Server-only LLM call for Phase 6 research cards (mock/public-style context).
 */
export async function researchProfileCard(
  input: ResearchProfileCardInput,
): Promise<ResearchArtifact> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OpenAI is not configured. Add OPENAI_API_KEY to the server environment.",
    );
  }

  const openai = new OpenAI({ apiKey });

  const userPayload = {
    display_name: input.displayName,
    headline: input.headline,
    canonical_profile_url: input.canonicalProfileUrl,
    student_school: input.studentSchool,
    campaign: {
      geography: input.params.geography,
      remote_preference: input.params.remote_preference,
      role_function: input.params.role_function,
      industries: input.params.industries,
      seniority: input.params.seniority,
      target_personas: input.params.target_personas,
      outreach_intent: input.params.outreach_intent,
    },
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: JSON.stringify(userPayload),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("Research model returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Research model returned invalid JSON.");
  }

  const result = researchArtifactSchema.safeParse(normalizePayload(parsed));
  if (!result.success) {
    throw new Error("Research model output did not match the expected shape.");
  }

  return result.data;
}
