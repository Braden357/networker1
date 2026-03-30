import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileRow } from "./profile-form";
import { ProfileSummary } from "./profile-summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "school, graduation_year, major, linkedin_profile_url, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profileRow: ProfileRow | null = profile
    ? {
        school: profile.school,
        graduation_year: profile.graduation_year,
        major: profile.major,
        linkedin_profile_url: profile.linkedin_profile_url,
      }
    : null;

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, status, created_at, raw_prompt")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Student profile
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Used for alumni matching and outreach drafts. US-focused for this MVP;
          you can edit anything below anytime.
        </p>

        {profileError ? (
          <p className="mt-4 text-sm text-amber-800">
            Could not load profile ({profileError.message}). Run the database
            migrations in Supabase (see{" "}
            <code className="rounded bg-zinc-100 px-1">supabase/migrations</code>
            ).
          </p>
        ) : (
          <>
            <ProfileSummary profile={profileRow} />
            <ProfileForm profile={profileRow} />
          </>
        )}

        {!profileError && profile?.created_at ? (
          <p className="mt-6 text-xs text-zinc-400">
            Account created{" "}
            {new Date(profile.created_at).toLocaleDateString()}
            {profile.updated_at
              ? ` · Profile updated ${new Date(profile.updated_at).toLocaleString()}`
              : null}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Campaigns
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Draft checklist (Phase 3), then run a stub pipeline with live
              progress (Phase 4).
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New campaign
          </Link>
        </div>
        {campaignsError ? (
          <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-amber-800">
            Could not load campaigns ({campaignsError.message}). Run{" "}
            <code className="rounded bg-zinc-100 px-1">
              supabase/migrations/20260329203000_campaigns.sql
            </code>{" "}
            in Supabase.
          </p>
        ) : campaigns && campaigns.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100 pt-4">
            {campaigns.map((c) => (
              <li key={c.id} className="py-3 first:pt-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-zinc-900 line-clamp-2">
                    {c.raw_prompt.slice(0, 120)}
                    {c.raw_prompt.length > 120 ? "…" : ""}
                  </p>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-700">
                      {c.status}
                    </span>
                    <Link
                      href={`/campaigns/${c.id}/checklist`}
                      className="font-medium text-zinc-900 underline"
                    >
                      Checklist
                    </Link>
                    {c.status === "running" ? (
                      <Link
                        href={`/campaigns/${c.id}/run`}
                        className="font-medium text-emerald-800 underline"
                      >
                        Progress
                      </Link>
                    ) : null}
                    {c.status === "complete" ? (
                      <>
                        <Link
                          href={`/campaigns/${c.id}/candidates`}
                          className="font-medium text-emerald-800 underline"
                        >
                          Results
                        </Link>
                        <Link
                          href={`/campaigns/${c.id}/run`}
                          className="font-medium text-zinc-600 underline"
                        >
                          Status
                        </Link>
                      </>
                    ) : null}
                    {c.status === "failed" ? (
                      <Link
                        href={`/campaigns/${c.id}/run`}
                        className="font-medium text-zinc-600 underline"
                      >
                        Status
                      </Link>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
            No drafts yet. Start with a short description of who you want to
            meet and why.
          </p>
        )}
      </section>

      <SignOutButton />
      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}

function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Sign out
      </button>
    </form>
  );
}
