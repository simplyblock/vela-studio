// Ignore barrel file rule here since it's just exporting more constants
// eslint-disable-next-line barrel-files/avoid-re-export-all
export * from './infrastructure'

export const API_URL = (() => {
  if (process.env.NODE_ENV === 'test') return 'http://localhost:3000/api'
  //  If running in platform, use API_URL from the env var
  return '/api'
})()

export const PG_META_URL = process.env.PLATFORM_PG_META_URL
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * @deprecated use DATETIME_FORMAT
 */
export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'

// should be used for all dayjs formattings shown to the user. Includes timezone info.
export const DATETIME_FORMAT = 'DD MMM YYYY, HH:mm:ss (ZZ)'

export const GOTRUE_ERRORS = {
  UNVERIFIED_GITHUB_USER: 'Error sending confirmation mail',
}

export const USAGE_APPROACHING_THRESHOLD = 0.75

export const GB = 1024 * 1024 * 1024
export const MB = 1024 * 1024
export const KB = 1024
