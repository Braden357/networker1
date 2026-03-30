import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-zinc-900">Sign-in error</h1>
        <p className="mt-2 text-sm text-zinc-600">
          We could not complete the authentication callback. Try signing in
          again.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
