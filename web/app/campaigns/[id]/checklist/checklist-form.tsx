"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import {
  saveCampaignChecklist,
  type ChecklistActionState,
} from "./actions";
import type { ExtractedParameters } from "@/lib/validations/campaign";

const initialState: ChecklistActionState = {
  error: null,
  success: false,
};

function lines(arr: string[]) {
  return arr.length ? arr.join("\n") : "";
}

export function ChecklistForm({
  campaignId,
  initial,
}: {
  campaignId: string;
  initial: ExtractedParameters;
}) {
  const [state, formAction, pending] = useActionState(
    saveCampaignChecklist,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.success]);

  const rp = initial.remote_preference ?? "either";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="campaign_id" value={campaignId} />

      {state.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Checklist saved. You can keep editing, or return to the dashboard when
          you&apos;re done.
        </p>
      ) : null}

      <div>
        <label
          htmlFor="geography"
          className="block text-sm font-medium text-zinc-800"
        >
          Geography
        </label>
        <input
          id="geography"
          name="geography"
          required
          defaultValue={initial.geography}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-zinc-800">
          Remote preference
        </legend>
        <div className="mt-2 space-y-2 text-sm text-zinc-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="remote_preference"
              value="local"
              defaultChecked={rp === "local"}
            />
            Local / in-person bias
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="remote_preference"
              value="remote"
              defaultChecked={rp === "remote"}
            />
            Remote-friendly
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="remote_preference"
              value="either"
              defaultChecked={rp === "either"}
            />
            Either
          </label>
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="role_function"
          className="block text-sm font-medium text-zinc-800"
        >
          Role / function
        </label>
        <input
          id="role_function"
          name="role_function"
          required
          defaultValue={initial.role_function}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="industries"
          className="block text-sm font-medium text-zinc-800"
        >
          Industries
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">One per line</p>
        <textarea
          id="industries"
          name="industries"
          rows={4}
          defaultValue={lines(initial.industries)}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="seniority"
          className="block text-sm font-medium text-zinc-800"
        >
          Seniority / level
        </label>
        <input
          id="seniority"
          name="seniority"
          required
          defaultValue={initial.seniority}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="target_personas"
          className="block text-sm font-medium text-zinc-800"
        >
          Target personas
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">
          e.g. alumni, analysts, interns — one per line
        </p>
        <textarea
          id="target_personas"
          name="target_personas"
          rows={4}
          defaultValue={lines(initial.target_personas)}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="companies_include"
          className="block text-sm font-medium text-zinc-800"
        >
          Companies to include
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">One per line; optional</p>
        <textarea
          id="companies_include"
          name="companies_include"
          rows={3}
          defaultValue={lines(initial.companies_include)}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="companies_exclude"
          className="block text-sm font-medium text-zinc-800"
        >
          Companies to exclude
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">One per line; optional</p>
        <textarea
          id="companies_exclude"
          name="companies_exclude"
          rows={3}
          defaultValue={lines(initial.companies_exclude)}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="outreach_intent"
          className="block text-sm font-medium text-zinc-800"
        >
          Outreach intent
        </label>
        <textarea
          id="outreach_intent"
          name="outreach_intent"
          required
          rows={3}
          defaultValue={initial.outreach_intent}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-zinc-800"
        >
          Language
        </label>
        <input
          id="language"
          name="language"
          defaultValue={initial.language}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save checklist"}
        </button>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Dashboard
        </Link>
        <Link
          href="/campaigns/new"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          New campaign
        </Link>
      </div>
    </form>
  );
}
