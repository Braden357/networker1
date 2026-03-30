import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractedParametersSchema } from "@/lib/validations/campaign";
import { ChecklistForm } from "./checklist-form";
import { RunCampaignButton } from "./run-campaign-button";

export default async function CampaignChecklistPage({
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

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      "id, raw_prompt, extracted_parameters, user_id, status, run_step, run_progress, run_error",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !campaign || campaign.user_id !== user.id) {
    notFound();
  }

  if (campaign.extracted_parameters == null) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-sm text-zinc-700">
          This draft has no extracted parameters yet.
        </p>
        <Link href="/campaigns/new" className="mt-4 inline-block text-sm underline">
          Start a new campaign
        </Link>
      </div>
    );
  }

  const parsed = extractedParametersSchema.safeParse(campaign.extracted_parameters);
  if (!parsed.success) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-sm text-amber-800">
          Saved parameters could not be loaded. Start a new campaign or contact
          support.
        </p>
        <Link href="/campaigns/new" className="mt-4 inline-block text-sm underline">
          New campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-600 underline hover:text-zinc-900"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Review checklist
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Edit anything the model inferred incorrectly, then save. When you run,
        work continues in the background (Phase 4 stub—no real discovery yet).
      </p>

      {campaign.status === "running" ? (
        <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Run in progress.{" "}
          <Link
            href={`/campaigns/${campaign.id}/run`}
            className="font-medium underline"
          >
            View live progress
          </Link>
        </p>
      ) : null}

      {campaign.status === "complete" ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Last run finished (stub).{" "}
          <Link
            href={`/campaigns/${campaign.id}/run`}
            className="font-medium underline"
          >
            View status
          </Link>
        </p>
      ) : null}

      {campaign.status === "failed" && campaign.run_error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Last run failed: {campaign.run_error}
        </p>
      ) : null}

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
        <h2 className="text-sm font-medium text-zinc-800">Run</h2>
        <p className="mt-1 text-xs text-zinc-600">
          Starts a short stub pipeline (~4s) so you can test progress UI. Add{" "}
          <code className="rounded bg-zinc-200 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          on the server for background updates.
        </p>
        <div className="mt-3">
          {campaign.status === "running" ? (
            <Link
              href={`/campaigns/${campaign.id}/run`}
              className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open progress
            </Link>
          ) : campaign.status === "complete" ? (
            <p className="text-sm text-zinc-600">
              This campaign already completed. Start a new campaign from the
              dashboard to run again.
            </p>
          ) : (
            <RunCampaignButton campaignId={campaign.id} />
          )}
        </div>
      </div>

      <details className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-zinc-700">
          Original prompt
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-zinc-600">
          {campaign.raw_prompt}
        </p>
      </details>
      <div className="mt-8">
        <ChecklistForm campaignId={campaign.id} initial={parsed.data} />
      </div>
    </div>
  );
}
