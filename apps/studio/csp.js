const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : ''
const SUPABASE_URL = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).origin
  : ''
const SUPABASE_PROJECTS_URL = 'https://*.supabase.co'
const SUPABASE_PROJECTS_URL_WS = 'wss://*.supabase.co'

// construct the URL for the Websocket Local URLs
let SUPABASE_LOCAL_PROJECTS_URL_WS = []
if (SUPABASE_URL) {
  const url = new URL(SUPABASE_URL)
  const hostWithPort = url.port ? `${url.hostname}:${url.port}` : url.hostname
  SUPABASE_LOCAL_PROJECTS_URL_WS = [
    `ws://${hostWithPort}`,
    `wss://${hostWithPort}`,
  ]
}

// Needed to test docs search in local dev
const SUPABASE_DOCS_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : ''

// Needed to test docs content API in local dev
const SUPABASE_CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL
  ? new URL(process.env.NEXT_PUBLIC_CONTENT_API_URL).origin
  : ''

const isDevOrStaging =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

const SUPABASE_STAGING_PROJECTS_URL = 'https://*.supabase.red'
const SUPABASE_STAGING_PROJECTS_URL_WS = 'wss://*.supabase.red'
const SUPABASE_COM_URL = 'https://supabase.com'
const CLOUDFLARE_CDN_URL = 'https://cdnjs.cloudflare.com'
const HCAPTCHA_SUBDOMAINS_URL = 'https://*.hcaptcha.com'
const HCAPTCHA_ASSET_URL = 'https://newassets.hcaptcha.com'
const HCAPTCHA_JS_URL = 'https://js.hcaptcha.com'
const CONFIGCAT_URL = 'https://cdn-global.configcat.com'
const CONFIGCAT_PROXY_URL = ['staging', 'local'].includes(
  process.env.NEXT_PUBLIC_ENVIRONMENT ?? ''
)
  ? 'https://configcat.supabase.green'
  : 'https://configcat.supabase.com'
const STRIPE_SUBDOMAINS_URL = 'https://*.stripe.com'
const STRIPE_JS_URL = 'https://js.stripe.com'
const STRIPE_NETWORK_URL = 'https://*.stripe.network'
const CLOUDFLARE_URL = 'https://www.cloudflare.com'
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_USER_CONTENT_URL = 'https://raw.githubusercontent.com'
const GITHUB_USER_AVATAR_URL = 'https://avatars.githubusercontent.com'
const GOOGLE_USER_AVATAR_URL = 'https://lh3.googleusercontent.com'

// This is a custom domain for Stape, which is used for GTM servers
const STAPE_URL = 'https://ss.supabase.com'

const SUPABASE_ASSETS_URL =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? 'https://frontend-assets.supabase.green'
    : 'https://frontend-assets.supabase.com'
const POSTHOG_URL = isDevOrStaging
  ? 'https://ph.supabase.green'
  : 'https://ph.supabase.com'

const USERCENTRICS_URLS = 'https://*.usercentrics.eu'
const USERCENTRICS_APP_URL = 'https://app.usercentrics.eu'

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com'

module.exports.getCSP = function getCSP() {
  const DEFAULT_SRC_URLS = [
    API_URL,
    SUPABASE_URL,
    ...SUPABASE_LOCAL_PROJECTS_URL_WS,
    SUPABASE_PROJECTS_URL,
    SUPABASE_PROJECTS_URL_WS,
    HCAPTCHA_SUBDOMAINS_URL,
    CONFIGCAT_URL,
    CONFIGCAT_PROXY_URL,
    STRIPE_SUBDOMAINS_URL,
    STRIPE_NETWORK_URL,
    CLOUDFLARE_URL,
    CLOUDFLARE_CDN_URL,
    GITHUB_API_URL,
    GITHUB_USER_CONTENT_URL,
    SUPABASE_ASSETS_URL,
    USERCENTRICS_URLS,
    STAPE_URL,
    GOOGLE_MAPS_API_URL,
    POSTHOG_URL,
    ...(isDevOrStaging
      ? [
          SUPABASE_STAGING_PROJECTS_URL,
          SUPABASE_STAGING_PROJECTS_URL_WS,
          SUPABASE_DOCS_PROJECT_URL,
          SUPABASE_CONTENT_API_URL,
        ]
      : []),
  ].filter(Boolean)

  const SCRIPT_SRC_URLS = [
    CLOUDFLARE_CDN_URL,
    HCAPTCHA_JS_URL,
    STRIPE_JS_URL,
    SUPABASE_ASSETS_URL,
    STAPE_URL,
    POSTHOG_URL,
  ].filter(Boolean)

  const FRAME_SRC_URLS = [HCAPTCHA_ASSET_URL, STRIPE_JS_URL, STAPE_URL].filter(Boolean)

  const IMG_SRC_URLS = [
    SUPABASE_URL,
    SUPABASE_COM_URL,
    SUPABASE_PROJECTS_URL,
    GITHUB_USER_AVATAR_URL,
    GOOGLE_USER_AVATAR_URL,
    SUPABASE_ASSETS_URL,
    USERCENTRICS_APP_URL,
    STAPE_URL,
    ...(isDevOrStaging ? [SUPABASE_STAGING_PROJECTS_URL] : []),
  ].filter(Boolean)

  const STYLE_SRC_URLS = [CLOUDFLARE_CDN_URL, SUPABASE_ASSETS_URL].filter(Boolean)
  const FONT_SRC_URLS = [CLOUDFLARE_CDN_URL, SUPABASE_ASSETS_URL].filter(Boolean)

  const CONNECT_SRC_URLS = [
    API_URL,
    SUPABASE_URL,
    SUPABASE_PROJECTS_URL,
    SUPABASE_PROJECTS_URL_WS,
    HCAPTCHA_SUBDOMAINS_URL,
    CONFIGCAT_URL,
    CONFIGCAT_PROXY_URL,
    STRIPE_SUBDOMAINS_URL,
    STRIPE_NETWORK_URL,
    CLOUDFLARE_URL,
    CLOUDFLARE_CDN_URL, // <-- fixes Monaco .map CSP issue
    GITHUB_API_URL,
    POSTHOG_URL,
    ...(isDevOrStaging ? ['ws://localhost:*', 'wss://localhost:*'] : []),
  ].filter(Boolean)

  const defaultSrcDirective = [`default-src 'self'`, ...DEFAULT_SRC_URLS].join(' ')
  const imgSrcDirective = [`img-src 'self' blob: data:`, ...IMG_SRC_URLS].join(' ')
  const scriptSrcDirective = [
    `script-src 'self' 'unsafe-eval' 'unsafe-inline'`,
    ...SCRIPT_SRC_URLS,
    GOOGLE_MAPS_API_URL,
  ].join(' ')
  const frameSrcDirective = [`frame-src 'self'`, ...FRAME_SRC_URLS].join(' ')
  const styleSrcDirective = [`style-src 'self' 'unsafe-inline'`, ...STYLE_SRC_URLS].join(' ')
  const fontSrcDirective = [`font-src 'self'`, ...FONT_SRC_URLS].join(' ')
  const workerSrcDirective = [`worker-src 'self' blob: data:`].join(' ')
  const connectSrcDirective = [`connect-src 'self'`, ...CONNECT_SRC_URLS].join(' ')

  const cspDirectives = [
    defaultSrcDirective,
    imgSrcDirective,
    scriptSrcDirective,
    frameSrcDirective,
    styleSrcDirective,
    fontSrcDirective,
    workerSrcDirective,
    connectSrcDirective,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `block-all-mixed-content`,
    ...(process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
      ? [`upgrade-insecure-requests`]
      : []),
  ]

  const csp = cspDirectives.join('; ') + ';'

  return csp.replace(/\s{2,}/g, ' ').trim()
}
