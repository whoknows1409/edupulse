const path = require("node:path");

/** @type {import("next").NextConfig} */
const projectRoot = path.resolve(__dirname);

const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.modules = [
      path.join(projectRoot, "node_modules"),
      ...(config.resolve.modules ?? []),
    ];
    return config;
  },
};

module.exports = nextConfig;
