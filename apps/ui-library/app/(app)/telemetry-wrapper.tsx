'use client'

import { API_URL } from '@/lib/constants'
import { PageTelemetry } from 'common'

export const TelemetryWrapper = () => {
  const { hasAcceptedConsent } = { hasAcceptedConsent: true } // FIXME if required, but I think it can be deleted
  return (
    <PageTelemetry
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={true}
    />
  )
}
