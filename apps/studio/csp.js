const BASE_URL = process.env.VELA_PLATFORM_EXT_BASE_URL
if (!BASE_URL) {
  throw new Error("Environment variable VELA_PLATFORM_EXT_BASE_URL not set")
}

const API_URL = new URL(BASE_URL).origin

const url = new URL(BASE_URL)
const hostWithPort = url.port ? `${url.hostname}:${url.port}` : url.hostname
const PROJECTS_URL = `https://*.${hostWithPort}`
const PROJECTS_URL_WS = `wss://*.${hostWithPort}`

// construct the URL for the Websocket Local URLs
const LOCAL_PROJECTS_URL_WS = []
if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
  LOCAL_PROJECTS_URL_WS.push(
    `ws://${hostWithPort}`,
  )
}

const isDevOrStaging =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

const CLOUDFLARE_CDN_URL = 'https://cdnjs.cloudflare.com'
const CLOUDFLARE_URL = 'https://www.cloudflare.com'
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_USER_CONTENT_URL = 'https://raw.githubusercontent.com'
const GITHUB_USER_AVATAR_URL = 'https://avatars.githubusercontent.com'
const GOOGLE_USER_AVATAR_URL = 'https://lh3.googleusercontent.com'

const ASSETS_URL = BASE_URL

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com'

module.exports.getCSP = function getCSP() {
  const DEFAULT_SRC_URLS = [
    API_URL,
    BASE_URL,
    ...LOCAL_PROJECTS_URL_WS,
    PROJECTS_URL,
    PROJECTS_URL_WS,
    CLOUDFLARE_URL,
    CLOUDFLARE_CDN_URL,
    GITHUB_API_URL,
    GITHUB_USER_CONTENT_URL,
    ASSETS_URL,
    GOOGLE_MAPS_API_URL
  ].filter(Boolean)

  const SCRIPT_SRC_URLS = [
    CLOUDFLARE_CDN_URL,
    ASSETS_URL,
  ].filter(Boolean)

  const FRAME_SRC_URLS = [].filter(Boolean)

  const IMG_SRC_URLS = [
    BASE_URL,
    PROJECTS_URL,
    GITHUB_USER_AVATAR_URL,
    GOOGLE_USER_AVATAR_URL,
    ASSETS_URL
  ].filter(Boolean)

  const STYLE_SRC_URLS = [CLOUDFLARE_CDN_URL, ASSETS_URL].filter(Boolean)
  const FONT_SRC_URLS = [CLOUDFLARE_CDN_URL, ASSETS_URL].filter(Boolean)

  const CONNECT_SRC_URLS = [
    API_URL,
    BASE_URL,
    PROJECTS_URL,
    PROJECTS_URL_WS,
    CLOUDFLARE_URL,
    CLOUDFLARE_CDN_URL, // <-- fixes Monaco .map CSP issue
    GITHUB_API_URL,
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
