import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { PropsWithChildren, ReactNode } from 'react'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { BASE_PATH } from 'lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Branch } from 'data/branches/branch-query'

interface BranchManagementSectionProps {
  header: string | ReactNode
  footer?: ReactNode
}

export const BranchManagementSection = ({
                                          header,
                                          footer,
                                          children,
                                        }: PropsWithChildren<BranchManagementSectionProps>) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-surface-100 shadow-sm flex justify-between items-center px-4 py-3 rounded-t-lg text-xs font-mono uppercase">
        {typeof header === 'string' ? <span>{header}</span> : header}
      </div>
      <div className="bg-surface border-t shadow-sm rounded-b-lg text-sm divide-y px-4">
        {children}
      </div>
      {footer !== undefined && <div className="bg-surface-100 px-6 py-1 border-t">{footer}</div>}
    </div>
  )
}

export const BranchRowLoader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-2.5">
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
    </div>
  )
}

export const BranchLoader = () => {
  return (
    <>
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
    </>
  )
}

interface BranchRowProps {
  label?: string | ReactNode
  branch: Branch
  rowLink?: string
  external?: boolean
  rowActions?: ReactNode
}

export const BranchRow = ({
                            branch,
                            label,
                            rowLink,
                            external = false,
                            rowActions,
                          }: BranchRowProps) => {
  const router = useRouter()
  const page = router.pathname.split('/').pop()

  const daysFromNow = dayjs().diff(dayjs(branch.updated_at), 'day')
  const formattedTimeFromNow = dayjs(branch.updated_at).fromNow()
  const formattedUpdatedAt = dayjs(branch.updated_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  const navigateUrl = rowLink ?? `/org/${branch.organization_id}/project/${branch.project_id}/branch/${branch.id}`

  const handleRowClick = () => {
    if (external) {
      window.open(`${BASE_PATH}/${navigateUrl}`, '_blank', 'noopener noreferrer')
    } else {
      router.push(navigateUrl)
    }
  }

  return (
    <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-100">
      <div className="flex items-center gap-x-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center cursor-pointer" onClick={handleRowClick}>
              {label || branch.name}
            </div>
          </TooltipTrigger>
          {((page === 'branches' && branch.name !== 'main') || page === 'merge-requests') && (
            <TooltipContent side="bottom">
              {page === 'branches' && branch.name !== 'main' && 'Switch to branch'}
              {page === 'merge-requests' && 'View merge request'}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
      <div className="flex items-center gap-x-4">
        <p className="text-xs text-foreground-lighter">
          {daysFromNow > 1 ? `Updated on ${formattedUpdatedAt}` : `Updated ${formattedTimeFromNow}`}
        </p>
        {rowActions}
      </div>
    </div>
  )
}