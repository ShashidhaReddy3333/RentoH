const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const supabaseHost = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
})();

const primaryHost = (() => {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
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
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      '@radix-ui/react-alert-dialog',
      'lodash',
      'date-fns'
    ]
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  },
  // Production source maps (disabled for smaller builds)
  productionBrowserSourceMaps: false,
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

// Redirect common www -> non-www if primaryHost is configured
nextConfig.redirects = async () => {
  if (!primaryHost) return [];
  return [
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: `www.${primaryHost}`
        }
      ],
      destination: `https://${primaryHost}/:path*`,
      permanent: true
    }
  ];
};

module.exports = withBundleAnalyzer(nextConfig);
