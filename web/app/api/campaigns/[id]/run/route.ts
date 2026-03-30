import { after } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMaxCompletedRunsPerWeek } from "@/lib/discovery/constants";
import { runCampaignPipeline } from "@/lib/jobs/run-campaign-pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "Background runs need SUPABASE_SERVICE_ROLE_KEY on the server. Add it in .env.local and Vercel (server-only).",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("campaigns")
    .select("id, status, extracted_parameters")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.status === "running") {
    return NextResponse.json(
      {
        error: "Already running",
        redirect: `/campaigns/${id}/run`,
      },
      { status: 409 },
    );
  }

  if (row.status === "complete") {
    return NextResponse.json(
      { error: "This campaign already finished. Start a new campaign to run again." },
      { status: 400 },
    );
  }

  if (row.extracted_parameters == null) {
    return NextResponse.json(
      { error: "Save your checklist before running." },
      { status: 400 },
    );
  }

  if (row.status !== "draft" && row.status !== "failed") {
    return NextResponse.json({ error: "Cannot start run from this state." }, { status: 400 });
  }

  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { count: completedThisWeek, error: countErr } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "complete")
    .gte("run_completed_at", weekAgo);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  const maxPerWeek = getMaxCompletedRunsPerWeek();
  if ((completedThisWeek ?? 0) >= maxPerWeek) {
    return NextResponse.json(
      {
        error: `MVP limit: at most ${maxPerWeek} completed run(s) per rolling 7 days. For local testing, set MVP_MAX_COMPLETED_RUNS_PER_WEEK in server env, use another account, or wait.`,
      },
      { status: 429 },
    );
  }

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({
      status: "running",
      run_step: "queued",
      run_progress: 0,
      run_error: null,
      run_started_at: new Date().toISOString(),
      run_completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  after(() => runCampaignPipeline(id));

  return NextResponse.json({ ok: true, redirect: `/campaigns/${id}/run` });
}
