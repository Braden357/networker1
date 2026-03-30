import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RunProgress } from "./run-progress";

export default async function CampaignRunPage({
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
    .select("id, user_id, status, extracted_parameters")
    .eq("id", id)
    .maybeSingle();

  if (error || !campaign || campaign.user_id !== user.id) {
    notFound();
  }

  if (campaign.extracted_parameters == null) {
    redirect(`/campaigns/${id}/checklist`);
  }

  if (campaign.status === "draft") {
    redirect(`/campaigns/${id}/checklist`);
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-600 underline hover:text-zinc-900"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
        We&apos;re working
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Campaign run in progress. You can close this tab—progress is saved on
        the server.
      </p>
      <div className="mt-8">
        <RunProgress campaignId={campaign.id} />
      </div>
    </div>
  );
}
