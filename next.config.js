/** @type {import('next').NextConfig} */
const { getHostRewritesBeforeFiles } = require("./deck-public-rewrites.cjs");

/** Ensures Vercel/serverless traces include deck JSON discovered only via fs.readdir at runtime. */
const LEARN_DECK_TRACE_GLOBS = ["./src/01_App/**/learn/**/*"];

const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/learn": LEARN_DECK_TRACE_GLOBS,
      "/learn/**": LEARN_DECK_TRACE_GLOBS,
      "/api/learn/**": LEARN_DECK_TRACE_GLOBS,
    },
  },
  async rewrites() {
    // File-driven learn routes: `learn.<appKey>.com/<flow>` and `learn.<appKey>.com/<flow>/<version>`.
    // Explicit param rule first so new version keys work even if build-time discovery missed a file.
    const hostCc = "learn.containercreations.com";
    const ccVentFallback = [
      {
        source: "/vent-onboarding/:version",
        has: [{ type: "host", value: hostCc }],
        destination: "/learn/containercreations/vent-onboarding/:version",
      },
    ];
    return {
      beforeFiles: [...ccVentFallback, ...getHostRewritesBeforeFiles()],
    };
  },
  async redirects() {
    return [
      {
        source: "/api/decks/:path*",
        destination: "/api/learn/:path*",
        permanent: false,
      },
      {
        source: "/learn/container-creations/:flowKey/:versionKey",
        destination: "/learn/containercreations/:flowKey/:versionKey",
        permanent: false,
      },
      {
        source: "/learn/gospel-discipleship/:flowKey/:versionKey",
        destination: "/learn/hiclarify/:flowKey/:versionKey",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gibson.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gibson.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.containercreations.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "containercreations.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.txt$/,
      type: "asset/source",
    });

    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });

    return config;
  },
};

module.exports = nextConfig;
