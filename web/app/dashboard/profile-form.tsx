"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "./actions";

export type ProfileRow = {
  school: string | null;
  graduation_year: number | null;
  major: string | null;
  linkedin_profile_url: string | null;
};

const initialActionState: ProfileActionState = {
  error: null,
  success: false,
};

export function ProfileForm({ profile }: { profile: ProfileRow | null }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialActionState,
  );

  const err = state.error;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <p className="text-xs text-zinc-500">
        Networking targets and copy are US-focused for this MVP.
      </p>

      {err?.form?.length ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err.form.join(" ")}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Profile saved.
        </p>
      ) : null}

      <div>
        <label
          htmlFor="school"
          className="block text-sm font-medium text-zinc-800"
        >
          School
        </label>
        <input
          id="school"
          name="school"
          required
          defaultValue={profile?.school ?? ""}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="e.g. University of California San Diego"
        />
        {err?.school?.length ? (
          <p className="mt-1 text-xs text-red-600">{err.school[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="graduation_year"
          className="block text-sm font-medium text-zinc-800"
        >
          Graduation year
        </label>
        <input
          id="graduation_year"
          name="graduation_year"
          type="number"
          required
          min={1950}
          max={2040}
          defaultValue={profile?.graduation_year ?? ""}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="2026"
        />
        {err?.graduation_year?.length ? (
          <p className="mt-1 text-xs text-red-600">{err.graduation_year[0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="major" className="block text-sm font-medium text-zinc-800">
          Major
        </label>
        <input
          id="major"
          name="major"
          required
          defaultValue={profile?.major ?? ""}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="e.g. Finance"
        />
        {err?.major?.length ? (
          <p className="mt-1 text-xs text-red-600">{err.major[0]}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="linkedin_profile_url"
          className="block text-sm font-medium text-zinc-800"
        >
          Your LinkedIn profile URL (optional)
        </label>
        <input
          id="linkedin_profile_url"
          name="linkedin_profile_url"
          type="url"
          defaultValue={profile?.linkedin_profile_url ?? ""}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="https://www.linkedin.com/in/your-profile"
        />
        {err?.linkedin_profile_url?.length ? (
          <p className="mt-1 text-xs text-red-600">
            {err.linkedin_profile_url[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
