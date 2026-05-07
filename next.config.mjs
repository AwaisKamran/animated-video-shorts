/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['remotion', '@remotion/player', '@remotion/google-fonts'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

export default nextConfig;
