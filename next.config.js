const supabaseHost = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['@heroicons/react/24/outline', '@heroicons/react/24/solid']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : [])
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 512_000,
        maxAssetSize: 512_000
      };
    }
    return config;
  }
};

module.exports = nextConfig;
