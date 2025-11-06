const { getCSP } = require('./csp')

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  output: 'standalone',
  experimental: {
    //webpackBuildWorker: true,
    turbopackFileSystemCacheForDev: true,
  },
  productionBrowserSourceMaps: true,
  async rewrites() {
    return []
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'next',
            value: 'new-project',
          },
        ],
        destination: '/new/new-project',
        permanent: false,
      },
      {
        source: '/',
        destination: '/org',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/sign-up',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/sign-up',
        permanent: false,
      },
      {
        source: '/signin',
        destination: '/sign-in',
        permanent: false,
      },
      {
        source: '/login',
        destination: '/sign-in',
        permanent: false,
      },
      {
        source: '/log-in',
        destination: '/sign-in',
        permanent: false,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/auth',
        destination: '/org/:slug/project/:ref/branch/:branch/auth/users',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database',
        destination: '/org/:slug/project/:ref/branch/:branch/database/tables',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database/graphiql',
        destination: '/org/:slug/project/:ref/branch/:branch/api/graphiql',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/storage',
        destination: '/org/:slug/project/:ref/branch/:branch/storage/buckets',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/storage',
        destination: '/org/:slug/project/:ref/branch/:branch/storage/settings',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/database',
        destination: '/org/:slug/project/:ref/branch/:branch/database/settings',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings',
        destination: '/org/:slug/project/:ref/branch/:branch/settings/general',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/auth/settings',
        destination: '/org/:slug/project/:ref/branch/:branch/auth/users',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'subscriptionPlan',
          },
        ],
        destination: '/org/_/billing?panel=subscriptionPlan',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'pitr',
          },
        ],
        destination: '/org/:slug/project/:ref/branch/:branch/settings/addons?panel=pitr',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'computeInstance',
          },
        ],
        destination: '/org/:slug/project/:ref/branch/:branch/settings/compute-and-disk',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/subscription',
        has: [
          {
            type: 'query',
            key: 'panel',
            value: 'customDomain',
          },
        ],
        destination: '/org/:slug/project/:ref/branch/:branch/settings/addons?panel=customDomain',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/subscription',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database/api-logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/edge-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database/postgres-logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/postgres-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database/postgrest-logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/postgrest-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database/pgbouncer-logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/pooler-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/logs/pgbouncer-logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/pooler-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/database/realtime-logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/realtime-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/storage/logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/storage-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/auth/logs',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/auth-logs',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/logs-explorer',
        destination: '/org/:slug/project/:ref/branch/:branch/logs/explorer',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/sql/templates',
        destination: '/org/:slug/project/:ref/branch/:branch/sql',
        permanent: true,
      },
      {
        source: '/org/:slug/settings',
        destination: '/org/:slug/general',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/update',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/update/free',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/update/pro',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/update/team',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        source: '/org/:slug/project/:ref/branch/:branch/settings/billing/update/enterprise',
        destination: '/org/_/billing',
        permanent: true,
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/reports/linter',
        destination: '/org/:slug/project/:ref/branch/:branch/database/linter',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/reports/query-performance',
        destination: '/org/:slug/project/:ref/branch/:branch/advisors/query-performance',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/query-performance',
        destination: '/org/:slug/project/:ref/branch/:branch/advisors/query-performance',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/auth/column-privileges',
        destination: '/org/:slug/project/:ref/branch/:branch/database/column-privileges',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/linter',
        destination: '/org/:slug/project/:ref/branch/:branch/database/security-advisor',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/security-advisor',
        destination: '/org/:slug/project/:ref/branch/:branch/advisors/security',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/performance-advisor',
        destination: '/org/:slug/project/:ref/branch/:branch/advisors/performance',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/webhooks',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations/webhooks/overview',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/wrappers',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations?category=wrapper',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/database/cron-jobs',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations/cron',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/api/graphiql',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations/graphiql',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/settings/vault/secrets',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations/vault/secrets',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/settings/vault/keys',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations/vault/keys',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/integrations/cron-jobs',
        destination: '/org/:slug/project/:ref/branch/:branch/integrations/cron',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/settings/warehouse',
        destination: '/org/:slug/project/:ref/branch/:branch/settings/general',
      },
      {
        permanent: true,
        source: '/org/:slug/project/:ref/branch/:branch/settings/functions',
        destination: '/org/:slug/project/:ref/branch/:branch/functions/secrets',
      },
      {
        source: '/org/:slug/invoices',
        destination: '/org/:slug/billing#invoices',
        permanent: true,
      },
      {
        source: '/projects',
        destination: '/organizations',
        permanent: false,
      },

      ...(process.env.NEXT_PUBLIC_BASE_PATH?.length
        ? [
            {
              source: '/',
              destination: process.env.NEXT_PUBLIC_BASE_PATH,
              basePath: false,
              permanent: false,
            },
          ]
        : []),
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*?)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'no-sniff',
          },
          {
            key: 'Content-Security-Policy',
            value: getCSP(),
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/img/:slug*',
        headers: [{ key: 'cache-control', value: 'public, max-age=2592000' }],
      },
      {
        source: '/favicon/:slug*',
        headers: [{ key: 'cache-control', value: 'public, max-age=86400' }],
      },
      {
        source: '/(.*).ts',
        headers: [{ key: 'content-type', value: 'text/typescript' }],
      },
    ]
  },
  images: {
    // to make Vercel avatars work without issue. Vercel uses SVGs for users who don't have set avatars.
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/*',
      },
    ],
  },
  transpilePackages: [
    'ui',
    'ui-patterns',
    'common',
    'shared-data',
    'api-types',
    'icons',
    'libpg-query',
  ],
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  serverExternalPackages: ["next-auth", "@auth/core"],
  // Both configs for turbopack and webpack need to exist (and sync) because Nextjs still uses webpack for production building
  webpack(config) {
    config.module?.rules
      .find((rule) => rule.oneOf)
      .oneOf.forEach((rule) => {
        if (rule.issuer?.and?.[0]?.toString().includes('_app')) {
          const and = rule.issuer.and
          rule.issuer.or = [/[\\/]node_modules[\\/]monaco-editor[\\/]/, { and }]
          delete rule.issuer.and
        }
      })

    // .md files to be loaded as raw text
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    })

    return config
  },
  onDemandEntries: {
    maxInactiveAge: 24 * 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
  typescript: {
    // WARNING: production builds can successfully complete even there are type errors
    // Typechecking is checked separately via .github/workflows/typecheck.yml
    ignoreBuildErrors: true,
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel
    ignoreDuringBuilds: true,
  },
  generateBuildId: async () => {
    // This could be anything, using the latest git hash
    return process.env.GIT_HASH
  },
}

module.exports = nextConfig
