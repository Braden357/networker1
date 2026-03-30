"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type RunStatusPayload = {
  status: string;
  run_step: string | null;
  run_progress: number | null;
  run_error: string | null;
  run_started_at: string | null;
  run_completed_at: string | null;
};

const STEP_LABEL: Record<string, string> = {
  queued: "Queued…",
  discover: "Discovering candidates (mock pool)",
  rank: "Ranking by fit (heuristic)",
  research: "Research cards + shared profile cache (LLM)",
  draft: "Drafting outreach (stub)",
  done: "Finished",
  failed: "Failed",
};

function stepLabel(step: string | null) {
  if (!step) return "Starting…";
  return STEP_LABEL[step] ?? step;
}

export function RunProgress({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<RunStatusPayload | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}/status`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setFetchError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    setFetchError(null);
    const json = (await res.json()) as RunStatusPayload;
    setData(json);
  }, [campaignId]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 1500);
    return () => clearInterval(t);
  }, [poll]);

  if (fetchError) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {fetchError}
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Loading status…</p>;
  }

  const pct = Math.min(100, Math.max(0, data.run_progress ?? 0));
  const failed = data.status === "failed";
  const done = data.status === "complete";

  return (
    <div className="space-y-4">
      {failed && data.run_error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {data.run_error}
        </p>
      ) : null}

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-800">
            {stepLabel(data.run_step)}
          </span>
          <span className="tabular-nums text-zinc-500">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              failed ? "bg-red-500" : "bg-zinc-900"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Progress is stored in Supabase. Phase 5 fills a mock candidate list during
        the run (ranked, with source labels)—open results when the bar hits 100%.
      </p>

      {done ? (
        <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <p>Run complete. Your ranked (mock) suggestions are ready.</p>
          <Link
            href={`/campaigns/${campaignId}/candidates`}
            className="inline-flex rounded-md bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            View suggested contacts
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/campaigns/${campaignId}/checklist`} className="underline">
          Checklist
        </Link>
        {done ? (
          <Link
            href={`/campaigns/${campaignId}/candidates`}
            className="underline"
          >
            Results
          </Link>
        ) : null}
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
