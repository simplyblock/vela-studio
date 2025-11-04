import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams, useTelemetryCookie } from 'common'
import { useSendGroupsIdentifyMutation } from 'data/telemetry/send-groups-identify-mutation'
import { useSendGroupsResetMutation } from 'data/telemetry/send-groups-reset-mutation'
import { usePrevious } from 'hooks/deprecated'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

const getAnonId = async (id: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(id)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const base64String = btoa(hashArray.map((byte) => String.fromCharCode(byte)).join(''))

  return base64String
}

const GroupsTelemetry = ({ hasAcceptedConsent }: { hasAcceptedConsent: boolean }) => {
  const router = useRouter()
  const { ref, slug } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const previousPathname = usePrevious(router.pathname)

  const { mutate: sendGroupsIdentify } = useSendGroupsIdentifyMutation()
  const { mutate: sendGroupsReset } = useSendGroupsResetMutation()

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''
  useTelemetryCookie({ hasAcceptedConsent, title, referrer })

  useEffect(() => {
    const isLandingOnProjectRoute =
      router.pathname.includes('[ref]') && previousPathname === router.pathname
    const isEnteringProjectRoute =
      !(previousPathname ?? '').includes('[ref]') && router.pathname.includes('[ref]')
    const isLeavingProjectRoute =
      (previousPathname ?? '').includes('[ref]') && !router.pathname.includes('[ref]')

    const isLandingOnOrgRoute =
      router.pathname.includes('[slug]') && previousPathname === router.pathname
    const isEnteringOrgRoute =
      !(previousPathname ?? '').includes('[slug]') && router.pathname.includes('[slug]')
    const isLeavingOrgRoute =
      (previousPathname ?? '').includes('[slug]') && !router.pathname.includes('[slug]')

    if (hasAcceptedConsent) {
      if (ref && (isLandingOnProjectRoute || isEnteringProjectRoute)) {
        sendGroupsIdentify({ organization_slug: organization?.id, project_ref: ref as string })
      } else if (slug && (isLandingOnOrgRoute || isEnteringOrgRoute)) {
        sendGroupsIdentify({ organization_slug: slug, project_ref: undefined })
      } else if (isLeavingProjectRoute || isLeavingOrgRoute) {
        sendGroupsReset({
          reset_organization: isLeavingOrgRoute || isLeavingProjectRoute,
          reset_project: isLeavingProjectRoute,
        })
      }
    }

  }, [hasAcceptedConsent, slug, ref, router.pathname])

  return null
}

export default GroupsTelemetry
