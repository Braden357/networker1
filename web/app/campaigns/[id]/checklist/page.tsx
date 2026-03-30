import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractedParametersSchema } from "@/lib/validations/campaign";
import { ChecklistForm } from "./checklist-form";

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
    .select("id, raw_prompt, extracted_parameters, user_id")
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
        Edit anything the model inferred incorrectly. This snapshot is saved on
        your campaign draft; discovery and outreach are not run yet.
      </p>
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
