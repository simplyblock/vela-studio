import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import { useParams } from 'common'
import {
  BranchServiceStatus,
  useBranchServiceStatusQuery,
} from 'data/service-status/service-status-query'
import {
  Button,
  InfoIcon,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

const SERVICE_STATUS_THRESHOLD = 5 // minutes

const StatusMessage = ({
  status,
  isLoading,
  isHealthy,
  isBranchNew,
}: {
  isLoading: boolean
  isHealthy: boolean
  isBranchNew: boolean
  status?: BranchServiceStatus
}) => {
  if (isHealthy) return 'Healthy'
  if (isLoading) return 'Checking status'
  if (status === 'UNHEALTHY') return 'Unhealthy'
  if (status === 'COMING_UP') return 'Coming up...'
  if (status === 'ACTIVE_HEALTHY') return 'Healthy'
  if (isBranchNew) return 'Coming up...'
  if (status) return status
  return 'Unable to connect'
}

const iconProps = {
  size: 18,
  strokeWidth: 1.5,
}
const LoaderIcon = () => <Loader2 {...iconProps} className="animate-spin" />
const AlertIcon = () => <AlertTriangle {...iconProps} />
const CheckIcon = () => <CheckCircle2 {...iconProps} className="text-brand" />

const StatusIcon = ({
  isLoading,
  isHealthy,
  isBranchNew,
  branchStatus,
}: {
  isLoading: boolean
  isHealthy: boolean
  isBranchNew: boolean
  branchStatus?: BranchServiceStatus
}) => {
  if (isHealthy) return <CheckIcon />
  if (isLoading) return <LoaderIcon />
  if (branchStatus === 'UNHEALTHY') return <AlertIcon />
  if (branchStatus === 'COMING_UP') return <LoaderIcon />
  if (branchStatus === 'ACTIVE_HEALTHY') return <CheckIcon />
  if (isBranchNew) return <LoaderIcon />
  return <AlertIcon />
}

export const ServiceStatus = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: branch } = useSelectedBranchQuery()
  const [open, setOpen] = useState(false)

  const storageEnabled = !!(branch?.max_resources.storage_bytes)

  // [Joshen] Need pooler service check eventually
  const {
    data: status,
    isLoading,
    refetch: refetchServiceStatus,
  } = useBranchServiceStatusQuery(
    {
      orgRef,
      projectRef,
      branchRef,
    },
    {
      refetchInterval: (data) => (data?.some((service) => !service.healthy) ? 5000 : false),
    }
  )

  //const authStatus = status?.find((service) => service.name === 'auth')
  const restStatus = status?.find((service) => service.name === 'rest')
  //const realtimeStatus = status?.find((service) => service.name === 'realtime')
  const storageStatus = status?.find((service) => service.name === 'storage')
  const dbStatus = status?.find((service) => service.name === 'db')

  // [Joshen] Need individual troubleshooting docs for each service eventually for users to self serve
  const services: {
    name: string
    error?: string
    docsUrl?: string
    isLoading: boolean
    isHealthy: boolean
    status: BranchServiceStatus
    logsUrl: string
  }[] = [
    {
      name: 'Database',
      error: undefined,
      docsUrl: undefined,
      isLoading: isLoading,
      isHealthy: !!dbStatus?.healthy,
      status: dbStatus?.status ?? 'UNHEALTHY',
      logsUrl: '/logs/postgres-logs',
    },
    {
      name: 'PostgREST',
      error: restStatus?.error,
      docsUrl: undefined,
      isLoading,
      isHealthy: !!restStatus?.healthy,
      status: restStatus?.status ?? 'UNHEALTHY',
      logsUrl: '/logs/postgrest-logs',
    },
    /*...(authEnabled
      ? [
          {
            name: 'Auth',
            error: authStatus?.error,
            docsUrl: undefined,
            isLoading,
            isHealthy: !!authStatus?.healthy,
            status: authStatus?.status ?? 'UNHEALTHY',
            logsUrl: '/logs/auth-logs',
          },
        ]
      : []),*/
    /*...(realtimeEnabled
      ? [
          {
            name: 'Realtime',
            error: realtimeStatus?.error,
            docsUrl: undefined,
            isLoading,
            isHealthy: !!realtimeStatus?.healthy,
            status: realtimeStatus?.status ?? 'UNHEALTHY',
            logsUrl: '/logs/realtime-logs',
          },
        ]
      : []),*/
    ...(storageEnabled
      ? [
          {
            name: 'Storage',
            error: storageStatus?.error,
            docsUrl: undefined,
            isLoading,
            isHealthy: !!storageStatus?.healthy,
            status: storageStatus?.status ?? 'UNHEALTHY',
            logsUrl: '/logs/storage-logs',
          },
        ]
      : []),
    /*...(edgeFunctionsEnabled
      ? [
          {
            name: 'Edge Functions',
            error: undefined,
            docsUrl: 'https://vela.run/docs/guides/functions/troubleshooting',
            isLoading,
            isHealthy: !!edgeFunctionsStatus?.healthy,
            status: edgeFunctionsStatus?.healthy
              ? 'ACTIVE_HEALTHY'
              : isLoading
                ? 'COMING_UP'
                : ('UNHEALTHY' as ProjectServiceStatus),
            logsUrl: '/logs/edge-functions-logs',
          },
        ]
      : []),*/
  ]

  const isLoadingChecks = services.some((service) => service.isLoading)
  const allServicesOperational = services.every((service) => service.isHealthy)

  // If the project is less than 5 minutes old, and status is not operational, then it's likely the service is still starting up
  const isBranchNew = branch?.status === 'CREATING'

  useEffect(() => {
    let timer: any

    if (isBranchNew) {
      const remainingTimeTillNextCheck = SERVICE_STATUS_THRESHOLD * 60

      timer = setTimeout(() => {
        refetchServiceStatus()
        //refetchEdgeFunctionServiceStatus()
      }, remainingTimeTillNextCheck * 1000)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [isBranchNew])

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          icon={
            isLoadingChecks || (!allServicesOperational && isBranchNew) ? (
              <LoaderIcon />
            ) : (
              <div
                className={`w-2 h-2 rounded-full ${
                  allServicesOperational ? 'bg-brand' : 'bg-warning'
                }`}
              />
            )
          }
        >
          Branch Status
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ portal className="p-0 w-56" side="bottom" align="center">
        {services.map((service) => (
          <Link
            href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}${service.logsUrl}`}
            key={service.name}
            className="transition px-3 py-2 text-xs flex items-center justify-between border-b last:border-none group relative hover:bg-surface-300"
          >
            <div className="flex gap-x-2">
              <StatusIcon
                isLoading={service.isLoading}
                isHealthy={service.isHealthy}
                isBranchNew={isBranchNew}
                branchStatus={service.status}
              />
              <div className="flex-1">
                <p>{service.name}</p>
                <p className="text-foreground-light flex items-center gap-1">
                  <StatusMessage
                    isLoading={service.isLoading}
                    isHealthy={service.isHealthy}
                    isBranchNew={isBranchNew}
                    status={service.status}
                  />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-1 transition opacity-0 group-hover:opacity-100">
              <span className="text-xs text-foreground">View logs</span>
              <ChevronRight size={14} className="text-foreground" />
            </div>
          </Link>
        ))}
        {allServicesOperational ? null : (
          <>
            <PopoverSeparator />
            <div className="flex gap-2 text-xs text-foreground-light px-3 py-2">
              <div className="mt-0.5">
                <InfoIcon />
              </div>
              Recently restored branches can take up to 5 minutes to become fully operational.
            </div>
          </>
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
