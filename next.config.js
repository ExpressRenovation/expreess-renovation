/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second `next dev`/`next build` run against its own build directory.
  // Two processes sharing `.next` corrupt the webpack cache and produce
  // "Cannot read properties of undefined (reading 'call')" at runtime.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // The kitchen-trends article was retitled from 2024 to 2026; keep the old
      // URL alive for anything that already linked to it.
      ...['es', 'en', 'de', 'nl', 'ca'].map((locale) => ({
        source: `/${locale}/blog/tendencias-reformas-cocina-2024`,
        destination: `/${locale}/blog/tendencias-reformas-cocina-2026`,
        permanent: true,
      })),
    ];
  },
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./src/backend/ai/prompts/**/*'],
      '/**/*': ['./src/backend/ai/prompts/**/*'],
    },
  },
};

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

module.exports = withNextIntl(nextConfig);

