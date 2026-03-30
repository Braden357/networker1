import { z } from "zod";

/** Payload stored in public_profile_cache.research_artifact (Phase 6 ResearchArtifact). */
export const researchArtifactSchema = z.object({
  summary: z.string().max(2000),
  bullets: z.array(z.string().max(500)).max(8),
  confidence: z.enum(["low", "medium", "high"]),
  gaps: z.string().max(1000).optional(),
  disclaimer: z.string().max(500).optional(),
  sources_note: z.string().max(500).optional(),
});

export type ResearchArtifact = z.infer<typeof researchArtifactSchema>;

export const emptyResearchArtifact: ResearchArtifact = {
  summary: "",
  bullets: [],
  confidence: "low",
};
