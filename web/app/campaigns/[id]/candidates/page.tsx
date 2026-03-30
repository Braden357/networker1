import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPublicProfileCacheStale } from "@/lib/profile/cache-stale";
import {
  researchArtifactSchema,
  type ResearchArtifact,
} from "@/lib/validations/research-artifact";

type PublicProfileCacheRow = {
  id: string;
  last_fetched_at: string;
  canonical_profile_url: string;
  research_artifact: unknown;
};

type CandidateRow = {
  id: string;
  rank_order: number;
  display_name: string;
  headline: string | null;
  profile_url: string;
  source_label: string;
  alumni_score: number;
  alumni_note: string | null;
  fit_score: number;
  public_profile_cache_id: string | null;
  public_profile_cache: PublicProfileCacheRow | null;
};

function confidenceLabel(c: ResearchArtifact["confidence"]): string {
  if (c === "high") return "Higher confidence";
  if (c === "medium") return "Medium confidence";
  return "Low confidence";
}

function ResearchCardBody({
  lastFetchedAt,
  canonicalUrl,
  artifact,
}: {
  lastFetchedAt: string;
  canonicalUrl: string;
  artifact: ResearchArtifact;
}) {
  const stale = isPublicProfileCacheStale(lastFetchedAt);

  return (
    <div className="mt-4 rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-sm text-zinc-800">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>
          Research updated{" "}
          {new Date(lastFetchedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
        {stale ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
            Stale — may refresh on next run
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900">
            Fresh (within TTL)
          </span>
        )}
        <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-zinc-700">
          {confidenceLabel(artifact.confidence)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-800">{artifact.summary}</p>
      {artifact.bullets.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700">
          {artifact.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
      {artifact.gaps ? (
        <p className="mt-2 text-xs text-zinc-600">
          <span className="font-medium text-zinc-700">Gaps: </span>
          {artifact.gaps}
        </p>
      ) : null}
      {artifact.sources_note ? (
        <p className="mt-2 text-xs text-zinc-600">{artifact.sources_note}</p>
      ) : null}
      {artifact.disclaimer ? (
        <p className="mt-2 text-xs text-amber-900/90">{artifact.disclaimer}</p>
      ) : null}
      <p className="mt-3 text-xs text-zinc-500">
        Canonical cache key:{" "}
        <span className="break-all font-mono text-zinc-600">{canonicalUrl}</span>
      </p>
    </div>
  );
}

export default async function CampaignCandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (cErr || !campaign || campaign.user_id !== user.id) {
    notFound();
  }

  if (campaign.status !== "complete") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-sm text-zinc-700">
          Candidates are available after a successful run (
          <strong>{campaign.status}</strong>
          ).
        </p>
        <Link href={`/campaigns/${id}/run`} className="mt-4 inline-block text-sm underline">
          Run progress
        </Link>
      </div>
    );
  }

  const { data: candidatesRaw, error: candErr } = await supabase
    .from("candidates")
    .select(
      `
      id,
      rank_order,
      display_name,
      headline,
      profile_url,
      source_label,
      alumni_score,
      alumni_note,
      fit_score,
      public_profile_cache_id,
      public_profile_cache (
        id,
        last_fetched_at,
        canonical_profile_url,
        research_artifact
      )
    `,
    )
    .eq("campaign_id", id)
    .order("rank_order", { ascending: true });

  const candidates = candidatesRaw as CandidateRow[] | null;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-600 underline hover:text-zinc-900"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Suggested contacts
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Phase 6: <strong>rich research cards</strong> from mock/public-style inputs with a{" "}
        <strong>shared profile cache</strong> (dedupe by canonical LinkedIn URL). Mock discovery
        and illustration URLs — not live LinkedIn search. Alumni ranking stays heuristic and
        unverified.
      </p>

      {candErr ? (
        <p className="mt-6 text-sm text-amber-800">
          Could not load candidates ({candErr.message}). Apply migrations through{" "}
          <code className="rounded bg-zinc-100 px-1">20260330120000_public_profile_cache.sql</code>{" "}
          in Supabase, then re-run the campaign.
        </p>
      ) : !candidates?.length ? (
        <p className="mt-6 text-sm text-zinc-600">
          No rows yet. Re-run the campaign from the checklist if this run finished before the
          latest migrations.
        </p>
      ) : (
        <ol className="mt-8 space-y-4">
          {candidates.map((c) => {
            const cache = c.public_profile_cache;
            const parsedArtifact = cache
              ? researchArtifactSchema.safeParse(cache.research_artifact ?? {})
              : null;
            const artifactOk = parsedArtifact?.success === true ? parsedArtifact.data : null;

            return (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-500">#{c.rank_order}</span>
                    <h2 className="text-base font-semibold text-zinc-900">{c.display_name}</h2>
                    {c.headline ? (
                      <p className="mt-1 text-sm text-zinc-600">{c.headline}</p>
                    ) : null}
                  </div>
                  <a
                    href={c.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm font-medium text-zinc-900 underline"
                  >
                    LinkedIn (sample URL)
                  </a>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                    {c.source_label}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                    Alumni signal: {c.alumni_score}/100
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                    Role/geo fit: {c.fit_score}/100
                  </span>
                </div>
                {c.alumni_note ? (
                  <p className="mt-2 text-xs text-amber-900">{c.alumni_note}</p>
                ) : null}

                {!c.public_profile_cache_id || !cache ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    No linked research cache for this row (older run). Start a new campaign run to
                    generate Phase 6 cards.
                  </p>
                ) : !artifactOk ? (
                  <p className="mt-3 text-xs text-amber-800">
                    Research card could not be loaded from cache (unexpected shape).
                  </p>
                ) : (
                  <ResearchCardBody
                    lastFetchedAt={cache.last_fetched_at}
                    canonicalUrl={cache.canonical_profile_url}
                    artifact={artifactOk}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href={`/campaigns/${id}/checklist`} className="underline">
          Checklist
        </Link>
        {" · "}
        <Link href={`/campaigns/${id}/run`} className="underline">
          Status
        </Link>
      </p>
    </div>
  );
}
