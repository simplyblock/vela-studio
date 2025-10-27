import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  calculateIOPSPrice,
  calculateThroughputPrice,
} from 'components/interfaces/DiskManagement/DiskManagement.utils'
import {
  DISK_PRICING,
  DiskType,
} from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import { MAX_REPLICAS_ABOVE_XL, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { formatCurrency } from 'lib/helpers'
import {
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query' // [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

// [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

interface DeployNewReplicaPanelProps {
  visible: boolean
  onSuccess: () => void
  onClose: () => void
}

const DeployNewReplicaPanel = ({ visible, onSuccess, onClose }: DeployNewReplicaPanelProps) => {
  const { slug, ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: branch } = useSelectedBranchQuery()

  const { data } = useReadReplicasQuery({ branch })
  const { data: diskConfiguration } = useDiskAttributesQuery({ projectRef })

  // @ts-ignore
  const { size_gb, type, throughput_mbps, iops } = diskConfiguration?.attributes ?? {}

  const readReplicaDiskSizes = (size_gb ?? 0) * 1.25
  const additionalCostDiskSize =
    readReplicaDiskSizes * (DISK_PRICING[type as DiskType]?.storage ?? 0)
  const additionalCostIOPS = calculateIOPSPrice({
    oldStorageType: type as DiskType,
    newStorageType: type as DiskType,
    oldProvisionedIOPS: 0,
    newProvisionedIOPS: iops ?? 0,
    numReplicas: 0,
  }).newPrice
  const additionalCostThroughput =
    type === 'gp3'
      ? calculateThroughputPrice({
          storageType: type as DiskType,
          newThroughput: throughput_mbps ?? 0,
          oldThroughput: 0,
          numReplicas: 0,
        }).newPrice
      : 0

  console.log(`[DeployNewReplicaPanel] slug: ${slug}`)
  useProjectDetailQuery(
    { slug, ref: projectRef },
    {
      refetchOnWindowFocus: false,
    }
  )

  const { mutate: setUpReplica, isLoading: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      toast.success(`Spinning up new replica...`)
      onSuccess()
      onClose()
    },
  })

  const currentPgVersion = Number(
    (branch?.database.version ?? '').split('supabase-postgres-')[1]?.split('.')[0]
  )

  const reachedMaxReplicas =
    (data ?? []).filter((db) => db.identifier !== projectRef).length >= MAX_REPLICAS_ABOVE_XL
  const canDeployReplica = !reachedMaxReplicas && currentPgVersion >= 15

  const onSubmit = async () => {
    if (!projectRef) return console.error('Project is required')
    if (!branch) return console.error('Branch is required')

    const primary = data?.find((db) => db.identifier === projectRef)
    setUpReplica({ branch, region: '' as Region, size: primary?.size ?? 't4g.small' })
  }

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      loading={isSettingUp}
      disabled={!canDeployReplica}
      className={cn('max-w-[500px]')}
      header="Deploy a new read replica"
      onConfirm={() => onSubmit()}
      confirmText="Deploy replica"
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-4">
        <div className="flex flex-col gap-y-6 mt-2">
          <div className="flex flex-col gap-y-2">
            <Collapsible_Shadcn_>
              <CollapsibleTrigger_Shadcn_ className="w-full flex items-center justify-between [&[data-state=open]>svg]:!-rotate-180">
                <p className="text-sm text-left">
                  New replica will cost an additional{' '}
                  <span translate="no">
                    {formatCurrency(
                      additionalCostDiskSize +
                        Number(additionalCostIOPS) +
                        Number(additionalCostThroughput)
                    )}
                    /month
                  </span>
                </p>
                <ChevronDown size={14} className="transition" />
              </CollapsibleTrigger_Shadcn_>
              <CollapsibleContent_Shadcn_ className="flex flex-col gap-y-1 mt-1">
                <p className="text-foreground-light text-sm">
                  Read replicas will match the compute size of your primary database and will
                  include 25% more disk size than the primary database to accommodate WAL files.
                </p>
                <p className="text-foreground-light text-sm">
                  The additional cost for the replica breaks down to:
                </p>
                <Table>
                  <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
                    <TableRow>
                      <TableHead className="w-[140px] pl-0">Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right pr-0">Cost (/month)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
                    <TableRow>
                      <TableCell className="pl-0">Disk size</TableCell>
                      <TableCell>
                        {((size_gb ?? 0) * 1.25).toLocaleString()} GB ({type})
                      </TableCell>
                      <TableCell className="text-right font-mono pr-0" translate="no">
                        {formatCurrency(additionalCostDiskSize)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-0">IOPS</TableCell>
                      <TableCell>{iops?.toLocaleString()} IOPS</TableCell>
                      <TableCell className="text-right font-mono pr-0" translate="no">
                        {formatCurrency(+additionalCostIOPS)}
                      </TableCell>
                    </TableRow>
                    {type === 'gp3' && (
                      <TableRow>
                        <TableCell className="pl-0">Throughput</TableCell>
                        <TableCell>{throughput_mbps?.toLocaleString()} MB/s</TableCell>
                        <TableCell className="text-right font-mono pr-0">
                          {formatCurrency(+additionalCostThroughput)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>

            <p className="text-foreground-light text-sm">
              Read more about{' '}
              <Link
                href="https://supabase.com/docs/guides/platform/manage-your-usage/read-replicas"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground transition"
              >
                billing
              </Link>{' '}
              for read replicas.
            </p>
          </div>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default DeployNewReplicaPanel
