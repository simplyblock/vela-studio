'use client'

import { PageTelemetry } from 'common'
import { useServiceUrls } from 'common/hooks/useServiceUrls'

export const TelemetryWrapper = () => {
  const { hasAcceptedConsent } = { hasAcceptedConsent: true } // FIXME if required, but I think it can be deleted
  const { data: serviceUrls, loading } = useServiceUrls()

  return (
    <PageTelemetry
      API_URL={serviceUrls.platformApiServiceUrl}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={loading}
    />
  )
}
