"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  submitCampaignPrompt,
  type PromptActionState,
} from "./actions";
import { RAW_PROMPT_MAX } from "@/lib/validations/campaign";

const initial: PromptActionState = { error: null };

export function PromptForm() {
  const [state, formAction, pending] = useActionState(
    submitCampaignPrompt,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error && formRef.current) {
      formRef.current.querySelector<HTMLTextAreaElement>("#prompt")?.focus();
    }
  }, [state.error]);

  return (
    <div className="mt-8">
      <form ref={formRef} action={formAction} className="space-y-4">
        {state.error ? (
          <p
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-zinc-800"
          >
            Describe your networking goal
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            Niche, geography, roles, industries, who you want to meet, and
            what you want out of outreach. English; US-focused MVP.
          </p>
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={12}
            disabled={pending}
            maxLength={RAW_PROMPT_MAX}
            placeholder="Example: I'm a junior at UCSD studying Finance in San Diego. I want coffee chats with alumni or analysts in corporate finance or FP&A in tech or biotech, mostly San Diego or remote. I'm learning how people broke in from undergrad..."
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-50"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Max {RAW_PROMPT_MAX.toLocaleString()} characters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "Extracting parameters…" : "Extract parameters"}
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
