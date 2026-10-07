import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://maps.googleapis.com https://*.googleapis.com https://js.stripe.com https://apis.google.com https://*.firebaseapp.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.stripe.com https://firebasestorage.googleapis.com https://images.unsplash.com https://lh3.googleusercontent.com https://*.googleapis.com https://*.gstatic.com https://maps.gstatic.com https://*.cdninstagram.com https://scontent.cdninstagram.com https://*.instagram.com https://api.maptiler.com https://*.maptiler.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://server.arcgisonline.com https://*.arcgisonline.com https://demotiles.maplibre.org;
  connect-src 'self' http://localhost:* http://127.0.0.1:* https://api.stripe.com https://*.googleapis.com https://maps.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://crowdbeats.ai https://www.crowdbeats.ai wss://crowdbeats.ai https://graph.instagram.com https://api.instagram.com https://api.maptiler.com https://*.maptiler.com https://router.project-osrm.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://server.arcgisonline.com https://*.arcgisonline.com https://demotiles.maplibre.org;
  frame-src 'self' http://localhost:* http://127.0.0.1:* https://js.stripe.com https://hooks.stripe.com https://crowdbeats.ai https://www.crowdbeats.ai https://*.google.com https://maps.google.com https://www.google.com;
  font-src 'self' https://fonts.gstatic.com https://api.maptiler.com https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://demotiles.maplibre.org data:;
  worker-src 'self' blob:;
  child-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://crowdbeats.ai https://www.crowdbeats.ai;
  frame-ancestors 'none';
  ${isDev ? '' : 'upgrade-insecure-requests;'}
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspHeader,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ['@crowdbeats/contracts'],
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Instagram CDN (real media_url from Graph API)
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.instagram.com' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      // Other existing remote images
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/auth/sign-in',
        destination: '/auth',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

