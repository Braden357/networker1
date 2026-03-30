"use client";

import { useState } from "react";

export function RunCampaignButton({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRun() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/run`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        error?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "Could not start run.");
        return;
      }
      window.location.href =
        typeof body.redirect === "string"
          ? body.redirect
          : `/campaigns/${campaignId}/run`;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRun}
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Starting…" : "Run campaign (stub pipeline)"}
      </button>
    </div>
  );
}
