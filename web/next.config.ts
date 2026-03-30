import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Monorepo: Next only auto-loads `.env*` from `web/`. If `OPENAI_API_KEY` (etc.)
// lives in the repo-root `.env`, load it here for local dev. Vercel still needs
// env vars set in the project dashboard (there is no parent `.env` there).
loadEnvConfig(path.join(process.cwd(), ".."));

const nextConfig: NextConfig = {
  // Monorepo: app lives in `web/` but the repo root is the parent. Vercel + Next
  // serverless tracing needs this so the route handler bundle is complete.
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
