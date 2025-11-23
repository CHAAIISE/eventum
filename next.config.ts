import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_ENOKI_API_KEY: process.env.NEXT_PUBLIC_ENOKI_API_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK,
  },
  // Exclude Walrus packages from server-side bundling (they contain WASM)
  // This works with both Turbopack and webpack
  serverExternalPackages: ['@mysten/walrus', '@mysten/walrus-wasm'],

  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {
    // Empty config to silence the warning - serverExternalPackages handles our needs
  },

  // Webpack config (for when using --webpack flag)
  webpack: (config, { isServer }) => {
    // Don't attempt to load WASM on the server
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mysten/walrus': false,
        '@mysten/walrus-wasm': false,
      };
    }

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

export default nextConfig;
