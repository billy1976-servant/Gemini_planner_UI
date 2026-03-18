/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gibson.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gibson.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.containercreations.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'containercreations.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // No @/apps-tsx override — Next resolves via tsconfig paths (src/apps-tsx).

    // Ignore .txt files - treat them as raw text assets
    // This prevents webpack from trying to parse them as JavaScript
    config.module.rules.push({
      test: /\.txt$/,
      type: 'asset/source',
    });

    // Ignore .md files - treat them as raw text assets
    // This prevents webpack from trying to parse them as JavaScript
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    return config;
  },
};

module.exports = nextConfig;
