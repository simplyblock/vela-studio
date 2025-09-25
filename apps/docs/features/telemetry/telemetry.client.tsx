'use client'

import { PageTelemetry as PageTelemetryImpl } from 'common'
import { API_URL } from '~/lib/constants'

const PageTelemetry = () => {
  const { hasAcceptedConsent } = { hasAcceptedConsent: true } // FIXME if required, but I think it can be deleted

  return (
    <PageTelemetryImpl
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={true}
    />
  )
}

export { PageTelemetry }
