import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: app lives in `web/` but the repo root is the parent. Vercel + Next
  // serverless tracing needs this so the route handler bundle is complete.
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
