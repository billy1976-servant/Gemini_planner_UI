/** @type {import('next').NextConfig} */
const { getHostRewritesBeforeFiles } = require("./deck-public-rewrites.cjs");

const nextConfig = {
  async rewrites() {
    // File-driven learn routes: `learn.<appKey>.com/<flow>` and `learn.<appKey>.com/<flow>/<version>`.
    return {
      beforeFiles: getHostRewritesBeforeFiles(),
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
