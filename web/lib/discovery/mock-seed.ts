import { MAX_CANDIDATES_PER_RUN } from "./constants";

export type MockCandidateSeed = {
  display_name: string;
  headline: string;
  profile_url: string;
  source_label: string;
};

const SOURCES = [
  "Mock: curated public-style sample",
  "Mock: job-board-style listing (illustrative)",
  "Mock: alumni keyword match (unverified)",
] as const;

const FIRST = [
  "Jordan",
  "Alex",
  "Taylor",
  "Riley",
  "Casey",
  "Morgan",
  "Jamie",
  "Quinn",
  "Avery",
  "Reese",
];

const LAST = [
  "Nguyen",
  "Patel",
  "Garcia",
  "Kim",
  "Chen",
  "Brown",
  "Martinez",
  "Lee",
  "Singh",
  "Okafor",
];

const ROLES = [
  "Financial Analyst",
  "FP&A Analyst",
  "Corporate Finance Associate",
  "Finance Rotational Program",
  "Investment Banking Analyst",
  "Treasury Analyst",
];

const ORGS = [
  "at a San Diego biotech",
  "at a regional tech company",
  "at a consumer brand",
  "at a healthcare org",
  "remote, US team",
];

/**
 * Deterministic-ish mock pool for UI; replace with real discovery in later phases.
 * Optionally weaves the student's school into some headlines so alumni ranking is visible.
 */
export function buildMockCandidateSeeds(
  count: number,
  schoolHint: string | null,
): MockCandidateSeed[] {
  const n = Math.min(MAX_CANDIDATES_PER_RUN, Math.max(1, count));
  const out: MockCandidateSeed[] = [];
  const school = schoolHint?.trim() || null;

  for (let i = 0; i < n; i++) {
    const fi = i % FIRST.length;
    const li = Math.floor(i / FIRST.length) % LAST.length;
    const ri = i % ROLES.length;
    const oi = i % ORGS.length;
    const name = `${FIRST[fi]} ${LAST[li]}`;
    const role = ROLES[ri];
    const org = ORGS[oi];
    const slug = `sample-${i + 1}-${fi}${li}${ri}`;
    const alum = school && i % 5 === 0;
    const headline = alum
      ? `${name} · ${school} alum · ${role} ${org} (illustrative mock)`
      : `${role} ${org} · networking outreach mock`;
    out.push({
      display_name: name,
      headline,
      profile_url: `https://www.linkedin.com/in/${slug}`,
      source_label: SOURCES[i % SOURCES.length]!,
    });
  }

  return out;
}
