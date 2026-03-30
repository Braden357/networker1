import type { ProfileRow } from "./profile-form";

function isCoreComplete(profile: ProfileRow | null): profile is ProfileRow & {
  school: string;
  graduation_year: number;
  major: string;
} {
  return Boolean(
    profile?.school?.trim() &&
      profile.graduation_year != null &&
      profile.major?.trim(),
  );
}

export function ProfileSummary({ profile }: { profile: ProfileRow | null }) {
  if (!isCoreComplete(profile)) {
    return (
      <div className="mb-6 rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Finish your student profile</p>
        <p className="mt-1 text-amber-900/90">
          Enter school, graduation year, and major below. LinkedIn is optional
          but helps personalize outreach drafts later.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border border-zinc-200 bg-zinc-50/80 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Saved profile
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-x-6">
        <div>
          <dt className="text-xs text-zinc-500">School</dt>
          <dd className="text-sm font-medium text-zinc-900">{profile.school}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Graduation year</dt>
          <dd className="text-sm font-medium text-zinc-900">
            {profile.graduation_year}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-zinc-500">Major</dt>
          <dd className="text-sm font-medium text-zinc-900">{profile.major}</dd>
        </div>
        {profile.linkedin_profile_url ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-zinc-500">LinkedIn</dt>
            <dd className="text-sm">
              <a
                href={profile.linkedin_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-600"
              >
                {profile.linkedin_profile_url}
              </a>
            </dd>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <dt className="text-xs text-zinc-500">LinkedIn</dt>
            <dd className="text-sm text-zinc-500">Not added</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
