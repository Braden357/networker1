import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { data: candidates, error: candErr } = await supabase
    .from("candidates")
    .select(
      "id, rank_order, display_name, headline, profile_url, source_label, alumni_score, alumni_note, fit_score",
    )
    .eq("campaign_id", id)
    .order("rank_order", { ascending: true });

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
        Phase 5 MVP: <strong>mock discovery</strong> with transparent source labels and
        heuristic alumni ranking (unverified). Not real LinkedIn search—see your
        development plan for production strategy.
      </p>

      {candErr ? (
        <p className="mt-6 text-sm text-amber-800">
          Could not load candidates ({candErr.message}). Run{" "}
          <code className="rounded bg-zinc-100 px-1">
            20260329220000_candidates.sql
          </code>{" "}
          in Supabase, then re-run the campaign.
        </p>
      ) : !candidates?.length ? (
        <p className="mt-6 text-sm text-zinc-600">
          No rows yet. Re-run the campaign from the checklist if this run
          finished before the candidates migration existed.
        </p>
      ) : (
        <ol className="mt-8 space-y-4">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-500">
                    #{c.rank_order}
                  </span>
                  <h2 className="text-base font-semibold text-zinc-900">
                    {c.display_name}
                  </h2>
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
            </li>
          ))}
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
