import type { MockCandidateSeed } from "./mock-seed";
import type { ExtractedParameters } from "@/lib/validations/campaign";

export type RankedCandidateInsert = MockCandidateSeed & {
  rank_order: number;
  alumni_score: number;
  alumni_note: string | null;
  fit_score: number;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function tokens(s: string) {
  return norm(s).split(/\s+/).filter((t) => t.length > 2);
}

/** Heuristic: headline mentions school tokens → possible alumni (still unverified). */
function scoreAlumni(headline: string, school: string | null): {
  score: number;
  note: string | null;
} {
  if (!school?.trim()) {
    return { score: 0, note: "Add your school on the dashboard for alumni ranking." };
  }
  const head = norm(headline);
  const schoolToks = tokens(school);
  let hits = 0;
  for (const t of schoolToks) {
    if (t.length > 3 && head.includes(t)) hits++;
  }
  if (hits === 0) {
    return { score: 12, note: "Possible alumni — not verified without graph data." };
  }
  if (hits === 1) {
    return { score: 55, note: "Possible alumni — headline overlap (unverified)." };
  }
  return { score: 88, note: "Stronger headline overlap with your school (still unverified)." };
}

function scoreFit(headline: string, params: ExtractedParameters): number {
  const head = norm(headline);
  let score = 10;
  const roleToks = tokens(params.role_function);
  for (const t of roleToks) {
    if (head.includes(t)) score += 18;
  }
  for (const ind of params.industries) {
    const it = norm(ind);
    if (it && head.includes(it)) score += 12;
  }
  const geoTok = norm(params.geography);
  if (geoTok && head.includes(geoTok)) score += 15;
  return Math.min(95, score);
}

export function rankMockCandidates(
  seeds: MockCandidateSeed[],
  params: ExtractedParameters,
  school: string | null,
): RankedCandidateInsert[] {
  const scored = seeds.map((s) => {
    const { score: alumni_score, note: alumni_note } = scoreAlumni(
      s.headline,
      school,
    );
    const fit_score = scoreFit(s.headline, params);
    return {
      ...s,
      alumni_score,
      alumni_note,
      fit_score,
      composite: alumni_score * 1.2 + fit_score,
    };
  });

  scored.sort((a, b) => b.composite - a.composite);

  return scored.map((s, i) => ({
    display_name: s.display_name,
    headline: s.headline,
    profile_url: s.profile_url,
    source_label: s.source_label,
    alumni_score: s.alumni_score,
    alumni_note: s.alumni_note,
    fit_score: s.fit_score,
    rank_order: i + 1,
  }));
}
