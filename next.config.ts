import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A Node server: `npm start` runs .next/standalone/server.js (see scripts/start.sh).
  output: "standalone",
  // A native module; the bundler must leave it to Node.
  serverExternalPackages: ["better-sqlite3"],
  // Keep local databases, which hold users' saved work, out of the standalone trace.
  outputFileTracingExcludes: { "*": ["data/**"] },
  experimental: {
    // Saved documents are capped at 512 KB in the app, so the cap gives the error, not this limit.
    serverActions: { bodySizeLimit: "1mb" },
  },
  turbopack: {
    // Pin the root so a stray lockfile outside the repo is not picked up.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
