import type { NextRequest } from 'next/server'

export const config = {
  matcher: '/api/:function*',
}

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/generate-v4',
  '/ai/code/complete',
  '/ai/sql/cron-v2',
  '/ai/sql/title-v2',
  '/ai/onboarding/design',
  '/ai/feedback/classify',
  '/get-ip-address',
  '/get-utc-time',
  '/get-deployment-commit',
  '/check-cname',
  '/edge-functions/test',
  '/edge-functions/body',
  '/telemetry/feature-flags',
  '/telemetry/identify',
  '/telemetry/event',
  '/telemetry/page',
  '/telemetry/page-leave',
  '/signup',
  '/signin',
  '/profile',
  '/profile/permissions',
  '/profile/audit-login',
  '/notifications/summary',
  '/organizations'
]

export function middleware(request: NextRequest) {
  /*if (
    !HOSTED_SUPPORTED_API_URLS.some((url) => request.nextUrl.pathname.endsWith(url))
  ) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }*/
}
