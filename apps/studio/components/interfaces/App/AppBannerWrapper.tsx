import { PropsWithChildren } from 'react'

import { ClockSkewBanner } from 'components/layouts/AppLayout/ClockSkewBanner'
import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  // FIXME: find way to show those notices
  const ongoingIncident = false
  const showNoticeBanner = false
  const clockSkewBanner = false

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        {ongoingIncident && <IncidentBanner />}
        {showNoticeBanner && <NoticeBanner />}
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}

export default AppBannerWrapper
