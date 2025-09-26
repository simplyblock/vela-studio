'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

import { sendTelemetryEvent } from 'common'
import { TelemetryEvent } from 'common/telemetry-constants'
import { useServiceUrls } from 'common/hooks/useServiceUrls'

export function useSendTelemetryEvent() {
  const pathname = usePathname()

  const { data: serviceUrls, loading } = useServiceUrls()

  return useCallback(
    (event: TelemetryEvent) => {
      if (!loading) return

      return sendTelemetryEvent(serviceUrls.platformApiServiceUrl, event, pathname)
    },
    [pathname, loading]
  )
}
