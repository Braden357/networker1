/**
 * Stable dedupe key for public LinkedIn profile URLs (Phase 6 cache).
 * Server-only; strips tracking query/hash and normalizes host/path quirks.
 */
export function canonicalizeLinkedInProfileUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Profile URL is empty");
  }

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error(`Invalid profile URL: ${trimmed.slice(0, 80)}`);
  }

  const host = url.hostname.toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    throw new Error("Profile URL must be on linkedin.com");
  }

  url.hash = "";
  url.search = "";

  const path =
    url.pathname.replace(/\/+$/, "") || url.pathname;

  const normalizedHost =
    host === "linkedin.com" || host === "www.linkedin.com"
      ? "www.linkedin.com"
      : host;

  return `https://${normalizedHost}${path}`;
}
