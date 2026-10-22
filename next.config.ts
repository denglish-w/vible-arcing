import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // The default image loader needs a server, which a static export does not have.
  images: { unoptimized: true },
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
