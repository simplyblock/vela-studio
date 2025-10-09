import Link from 'next/link'
import { useState } from 'react'

import { InfraInstanceSize } from 'components/interfaces/DiskManagement/DiskManagement.types'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import ShimmeringLoader from './ShimmeringLoader'
import { useParams } from 'common'

const Row = ({ label, stat }: { label: string; stat: React.ReactNode | string }) => {
  return (
    <div className="flex flex-row gap-2">
      <span className="text-sm text-foreground-light w-16">{label}</span>
      <span className="text-sm">{stat}</span>
    </div>
  )
}

interface ComputeBadgeWrapperProps {
  project: {
    ref?: string
    organization_slug?: string
    cloud_provider?: string
    infra_compute_size?: InfraInstanceSize
  }
}

export const ComputeBadgeWrapper = ({ project }: ComputeBadgeWrapperProps) => {
  // handles the state of the hover card
  // once open it will fetch the addons
  const [open, setOpenState] = useState(false)

  const { slug: orgRef, branch: branchRef } = useParams()

  if (!project?.infra_compute_size) return null

  return (
    <HoverCard onOpenChange={() => setOpenState(!open)} openDelay={280}>
      <HoverCardTrigger asChild className="group" onClick={(e) => e.stopPropagation()}>
        <div>
          <ComputeBadge infraComputeSize={project.infra_compute_size} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="p-0 overflow-hidden w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 px-5 text-xs text-foreground-lighter">Compute size</div>
        <Separator />
        <div className="p-3 px-5 flex flex-row gap-4">
          <div>
            <ComputeBadge infraComputeSize={project?.infra_compute_size} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              {/* meta is only undefined for nano sized compute */}
              <Row label="CPU" stat="Shared" />
              <Row label="Memory" stat="Up to 0.5 GB" />
            </div>
          </div>
        </div>
        <Separator />
        <div className="p-3 px-5 text-sm flex flex-col gap-2 bg-studio">
          <div className="flex flex-col gap-0">
            <p className="text-foreground">
              Unlock more compute
            </p>
            <p className="text-foreground-light">
              Scale your project up to 64 cores and 256 GB RAM.
            </p>
          </div>
          <div>
            <Button asChild type="default" htmlType="button" role="button">
              <Link href={`/org/${orgRef}/project/${project?.ref}/branch/${branchRef}/settings/compute-and-disk`}>
                Upgrade compute
              </Link>
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
