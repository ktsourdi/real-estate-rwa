/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Silence optional deps required by walletconnect/pino in browser builds
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      encoding: false,
      'pino-pretty': false,
    }
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      buffer: false,
      stream: false,
      util: false,
    }
    return config
  },
};

module.exports = nextConfig;
