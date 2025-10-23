const mapboxHosts = [
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com'
];

const supabaseHost = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
})();

const connectSrc = ["'self'", ...mapboxHosts];
const imgSrc = ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', ...mapboxHosts];
const fontSrc = ["'self'", 'data:', 'https://api.mapbox.com'];

if (supabaseHost) {
  connectSrc.push(`https://${supabaseHost}`);
  imgSrc.push(`https://${supabaseHost}`);
  fontSrc.push(`https://${supabaseHost}`);
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `connect-src ${connectSrc.join(' ')}`,
  `img-src ${imgSrc.join(' ')}`,
  `font-src ${fontSrc.join(' ')}`,
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['lucide-react']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : [])
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};

module.exports = nextConfig;
