/* eslint-disable @typescript-eslint/no-var-requires */
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
      'date-fns',
      'date-fns-tz'
    ]
  },
  // Modularize imports for better tree-shaking
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}'
    },
    'date-fns': {
      transform: 'date-fns/{{member}}'
    }
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
    formats: ["image/avif", "image/webp"],
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
        // Loosen limits slightly to account for vendor chunks while
        // keeping guardrails. Heavy libs are already lazy-loaded.
        maxEntrypointSize: 1024_000,
        maxAssetSize: 1_200_000
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

nextConfig.headers = async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' }
    ]
  },
  {
    source: '/_next/static/:path*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
    ]
  }
];

module.exports = withBundleAnalyzer(nextConfig);
