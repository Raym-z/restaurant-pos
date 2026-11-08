import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep agent instructions in AGENTS.md stable; do not rewrite them on dev start.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
