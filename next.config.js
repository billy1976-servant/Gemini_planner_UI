/** @type {import('next').NextConfig} */
const { getHostRewritesBeforeFiles } = require("./deck-public-rewrites.cjs");

/** Ensures Vercel/serverless traces include deck JSON discovered only via fs.readdir at runtime. */
const LEARN_DECK_TRACE_GLOBS = ["./src/01_App/**/learn/**/*"];
/**
 * Hard safety-net for live host canonicalization before any filesystem route matching.
 * Keep these rules explicit so learn.hiclarify.com never falls into legacy domain runtime paths.
 */
const PINNED_LEARN_HICLARIFY_REWRITES = [
  {
    source: "/",
    has: [{ type: "host", value: "learn.hiclarify.com" }],
    destination: "/learn/hiclarify/track-1/v1",
  },
  {
    source: "/track-1",
    has: [{ type: "host", value: "learn.hiclarify.com" }],
    destination: "/learn/hiclarify/track-1/v1",
  },
  {
    source: "/track-1/v1",
    has: [{ type: "host", value: "learn.hiclarify.com" }],
    destination: "/learn/hiclarify/track-1/v1",
  },
];

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
    return {
      beforeFiles: [...PINNED_LEARN_HICLARIFY_REWRITES, ...getHostRewritesBeforeFiles()],
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
        // Compatibility-only: legacy appKey spelling.
        source: "/learn/container-creations/:flowKey/:versionKey",
        destination: "/learn/containercreations/:flowKey/:versionKey",
        permanent: false,
      },
      {
        // Compatibility-only: legacy appKey spelling.
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
