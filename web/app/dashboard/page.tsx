import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileRow } from "./profile-form";

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
          Used for alumni matching and professional outreach drafts (Phase 2).
        </p>

        {profileError ? (
          <p className="mt-4 text-sm text-amber-800">
            Could not load profile ({profileError.message}). Run the database
            migrations in Supabase (see{" "}
            <code className="rounded bg-zinc-100 px-1">supabase/migrations</code>
            ).
          </p>
        ) : (
          <ProfileForm profile={profileRow} />
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
