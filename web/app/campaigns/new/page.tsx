import Link from "next/link";
import { PromptForm } from "./prompt-form";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-600 underline hover:text-zinc-900"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
        New campaign
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        We&apos;ll infer a structured checklist from your description. You can
        edit every field on the next step before any search or outreach runs.
      </p>
      <PromptForm />
    </div>
  );
}
