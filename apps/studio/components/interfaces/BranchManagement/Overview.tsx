import {
  MoreVertical,
  Pencil,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { BranchLoader, BranchManagementSection, BranchRow, BranchRowLoader } from './BranchPanels'
import { EditBranchModal } from './EditBranchModal'

interface OverviewProps {
  isLoading: boolean
  isSuccess: boolean
  mainBranch: Branch
  onSelectCreateBranch: () => void
  onSelectDeleteBranch: (branch: Branch) => void
}

export const Overview = ({
                           isLoading,
                           isSuccess,
                           mainBranch,
                           onSelectCreateBranch,
                           onSelectDeleteBranch,
                         }: OverviewProps) => {

  const { slug: orgSlug, ref: projectRef } = useParams()
  
  const { data: branches, isLoading: isBranchesLoading } = useBranchesQuery({
    orgSlug,
    projectRef
  })

  return (
    <>
      <BranchManagementSection header="Production branch">
        {isLoading && <BranchRowLoader />}
        {isSuccess && mainBranch !== undefined && (
          <BranchRow
            branch={mainBranch}
            label={
              <div className="flex items-center gap-x-2">
                <Shield size={14} strokeWidth={1.5} className="text-warning" />
                {mainBranch.name}
              </div>
            }
            rowActions={<MainBranchActions branch={mainBranch} />}
          />
        )}
        {isSuccess && mainBranch === undefined && (
          <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-100">
            <Link href={`/project/${projectRef}`} className="text-foreground block w-full">
              <div className="flex items-center gap-x-3">
                <Shield size={14} strokeWidth={1.5} className="text-warning" />
                main
              </div>
            </Link>
          </div>
        )}
      </BranchManagementSection>

      {/* Persistent Branches Section */}
      <BranchManagementSection header="Persistent branches">
        {isLoading && <BranchLoader />}
        {isSuccess && (branches?.length || 0) === 0 && (
          <div className="flex items-center flex-col justify-center w-full py-10">
            <p>No persistent branches</p>
            <p className="text-foreground-light text-center">
              Persistent branches are long-lived, cannot be reset, and are ideal for staging
              environments.
            </p>
          </div>
        )}
        {isSuccess &&
          !isBranchesLoading &&
          branches?.map((branch) => {
            return (
              <BranchRow
                key={branch.id}
                branch={branch}
              />
            )
          })}
      </BranchManagementSection>
    </>
  )
}

// Actions for main (production) branch
const MainBranchActions = ({ branch }: { branch: Branch }) => {
  const { ref: projectRef } = useParams()
  // FIXME: need permission implemented
  const { can: canUpdateBranches } = { can: true }
  const [showEditBranchModal, setShowEditBranchModal] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" icon={<MoreVertical />} className="px-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="bottom" align="end">
          <DropdownMenuItem
            className="gap-x-2"
            disabled={!canUpdateBranches}
            onSelect={() => setShowEditBranchModal(true)}
            onClick={() => setShowEditBranchModal(true)}
          >
            <Pencil size={14} /> Edit Branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBranchModal
        branch={branch}
        visible={showEditBranchModal}
        onClose={() => setShowEditBranchModal(false)}
      />
    </>
  )
}