import Link from 'next/link'

import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'

const IncidentBanner = () => {
  return (
    <Link href="https://status.vela.run" target="_blank" rel="noopener noreferrer">
      <HeaderBanner
        type="incident"
        title="We are currently investigating a technical issue"
        message="Follow status.vela.run for updates"
      />
    </Link>
  )
}

export default IncidentBanner
