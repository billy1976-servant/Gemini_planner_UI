/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
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
