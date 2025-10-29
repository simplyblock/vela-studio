import { partition } from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { Overview } from 'components/interfaces/BranchManagement/Overview'
import BranchLayout from 'components/layouts/BranchLayout/BranchLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { Branch } from 'data/branches/branch-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const BranchesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const [selectedBranchToDelete, setSelectedBranchToDelete] = useState<Branch>()

  const { mutate: sendEvent } = useSendEventMutation()

  const projectRef = project !== undefined ? ref : undefined

  const { can: canReadBranches, isSuccess: isPermissionsLoaded } = useCheckPermissions("env:projects:read")

  const {
    data: branches,
    error: branchesError,
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    isSuccess: isSuccessBranches,
  } = useBranchesQuery({ projectRef })
  const [[mainBranch]] = partition(branches, (branch) => branch.name === 'main')

  const isError = isErrorBranches
  const isLoading = isLoadingBranches
  const isSuccess = isSuccessBranches

  const { mutate: deleteBranch, isLoading: isDeleting } = useBranchDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted branch')
      setSelectedBranchToDelete(undefined)
    },
  })

  const onConfirmDeleteBranch = () => {
    if (selectedBranchToDelete == undefined) return console.error('No branch selected')
    const { id: branch, project_id: projectRef, organization_id: orgSlug } = selectedBranchToDelete
    deleteBranch(
      { orgSlug, projectRef, branch  },
      {
        onSuccess: () => {
          if (branch === ref) {
            router.push(`/org/${orgSlug}/project/${projectRef}/branch`)
          }
          // Track delete button click
          sendEvent({
            action: 'branch_delete_button_clicked',
            properties: {
              branchType: 'persistent',
              origin: 'branches_page',
            },
            groups: {
              project: projectRef ?? 'Unknown',
              organization: selectedOrg?.slug ?? 'Unknown',
            },
          })
        },
      }
    )
  }

  useEffect(() => {
    if (!isSuccessBranches) return
    if (branches?.length || 0) {
      return router.push(`/new/${slug}/${ref}?name=main`)
    }
  }, [router, isSuccessBranches, branches])

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="space-y-4">
              {isPermissionsLoaded && !canReadBranches ? (
                <NoPermission resourceText="view this project's branches" />
              ) : (
                <>
                  {isErrorBranches && (
                    <AlertError
                      error={branchesError}
                      subject="Failed to retrieve preview branches"
                    />
                  )}

                  {!isError && (
                    <Overview
                      isLoading={isLoading}
                      isSuccess={isSuccess}
                      mainBranch={mainBranch}
                      onSelectCreateBranch={() => snap.setShowCreateBranchModal(true)}
                      onSelectDeleteBranch={setSelectedBranchToDelete}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <TextConfirmModal
        variant="warning"
        visible={selectedBranchToDelete !== undefined}
        onCancel={() => setSelectedBranchToDelete(undefined)}
        onConfirm={() => onConfirmDeleteBranch()}
        loading={isDeleting}
        title="Delete branch"
        confirmLabel="Delete branch"
        confirmPlaceholder="Type in name of branch"
        confirmString={selectedBranchToDelete?.name ?? ''}
        alert={{ title: 'You cannot recover this branch once deleted' }}
        text={
          <>
            This will delete your database preview branch{' '}
            <span className="text-bold text-foreground">{selectedBranchToDelete?.name}</span>.
          </>
        }
      />
    </>
  )
}

BranchesPage.getLayout = (page) => {
  const BranchesPageWrapper = () => {
    const snap = useAppStateSnapshot()
    const { can: canCreateBranches } = useCheckPermissions("project:branches:create")

    const primaryActions = (
      <ButtonTooltip
        type="primary"
        disabled={!canCreateBranches}
        onClick={() => snap.setShowCreateBranchModal(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canCreateBranches
              ? 'You need additional permissions to create branches'
              : undefined,
          },
        }}
      >
        Create branch
      </ButtonTooltip>
    )

    return (
      <PageLayout
        title="Branches"
        subtitle="Manage your database branches"
        primaryActions={primaryActions}
      >
        {page}
      </PageLayout>
    )
  }

  return (
    <DefaultLayout>
      <BranchLayout>
        <BranchesPageWrapper />
      </BranchLayout>
    </DefaultLayout>
  )
}

export default BranchesPage