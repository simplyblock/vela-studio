import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Play, Pause, Trash2 } from 'lucide-react'
import { useBranchPauseMutation } from 'data/branches/branch-pause-mutation'
import { useBranchResumeMutation } from 'data/branches/branch-resume-mutation'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { PROJECT_STATUS } from 'lib/constants'
import { TimestampInfo } from 'ui-patterns'

import AlertError from 'components/ui/AlertError'

import { Button, cn } from 'ui'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import type { NextPageWithLayout } from 'types'
import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ResizeBranchModal from 'components/interfaces/Branch/ResizeBranchModal'
import { BranchResourceBadge } from 'components/interfaces/Branch/BranchResourceBadge'
import ProjectResourcesPanel from 'components/interfaces/Project/ProjectResourcesPanel'

const ProjectOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, ref: projectRef } = useParams() as { slug: string; ref?: string }
  // track which branch is being toggled/deleted (for button spinners/disable)
const [togglingId, setTogglingId] = useState<string | null>(null)
const [deletingId, setDeletingId] = useState<string | null>(null)

// pause / resume
const pauseBranch = useBranchPauseMutation({
  onSettled: () => setTogglingId(null),
})
const resumeBranch = useBranchResumeMutation({
  onSettled: () => setTogglingId(null),
})

// delete
const deleteBranch = useBranchDeleteMutation({
  onSettled: () => {
    setDeletingId(null)
    setDeleteTarget(null)
  },
})

  // project info
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isErrorProject,
    error: projectError,
  } = useSelectedProjectQuery()

  // branches for this project
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    error: branchesError,
  } = useBranchesQuery({ orgRef: slug, projectRef }, { enabled: !!slug && !!projectRef })


  // any resource warnings tied to this project
  const {
    data: resourceWarnings = [],
    isLoading: isLoadingWarnings,
    isError: isErrorWarnings,
    error: warningsError,
  } = useResourceWarningsQuery()

  const projectWarning = useMemo(() => {
    if (!project?.id) return undefined
    return resourceWarnings.find((w) => w.project === project.id)
  }, [project?.id, resourceWarnings])

  // ── Local state for delete confirmation ─────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // ---- Loading state ----
  if (isProjectLoading || isLoadingBranches || !projectRef || !slug) {
    return (
      <div className="w-full px-4 py-8">
        <div className="mx-auto max-w-7xl flex flex-col gap-y-8">
          <HeaderSkeleton />
          <BranchesSkeleton />
        </div>
      </div>
    )
  }

  // ---- Error states ----
  if (isErrorProject) {
    return (
      <div className="w-full px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <AlertError subject="Failed to load project details" error={projectError} />
        </div>
      </div>
    )
  }

  if (isErrorBranches) {
    return (
      <div className="w-full px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <AlertError subject="Failed to load branches for this project" error={branchesError} />
        </div>
      </div>
    )
  }

// Heuristic: treat branch as running when not paused.
// (Adjust if your API exposes a definitive status)
const isBranchRunning = (branch: any) => !branch?.is_paused

const onToggleBranch = (branch: any) => {
  const branchKey = branch.name as string
  setTogglingId(branch.id)

  if (isBranchRunning(branch)) {
    pauseBranch.mutate({ orgSlug: slug!, projectRef: projectRef!, branch: branchKey })
  } else {
    resumeBranch.mutate({ orgSlug: slug!, projectRef: projectRef!, branch: branchKey })
  }
}

const onConfirmDeleteBranch = async () => {
  if (!deleteTarget) return
  setDeletingId(deleteTarget.id)
  deleteBranch.mutate({
    orgSlug: slug!,
    projectRef: projectRef!,
    branch: deleteTarget.id, // keep in sync with cache update (filters by name)
  })
}


  return (
    <div className="w-full px-4 py-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-y-8">
        {/* ———————————————————
            Project header / status
        ——————————————————— */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 w-full">
            <div className="space-y-2">
              <h1 className="text-3xl text-foreground">{project?.name ?? projectRef}</h1>

              <p className="text-sm text-foreground-light">
                Project ref: <span className="font-mono text-xs">{projectRef}</span>
              </p>

              <ProjectStatusBadge status={project?.status} />

              {isErrorWarnings && (
                <AlertError subject="Failed to load resource warnings" error={warningsError} />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
              <Button className="text-black" asChild type="primary">
                <Link href={`/new/${slug}/${projectRef}/`}>Create Branch</Link>
              </Button>
            </div>
          </div>

          <ProjectUpgradeFailedBanner />
          <ProjectResourcesPanel orgRef={slug} projectRef={projectRef} />
        </section>

        {/* ———————————————————
            Branches section
        ——————————————————— */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-base font-medium text-foreground">Branches</h2>
              <p className="text-sm text-foreground-light">
                Each branch is an isolated environment of this project.
              </p>
            </div>
          </div>

          {branches.length === 0 ? (
            <EmptyBranchesState slug={slug} projectRef={projectRef} projectName={project.name} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch: any) => (
                <li
                  key={branch.id}
                  className={cn(
                    'rounded border border-default bg-surface-100 p-4 flex flex-col justify-between'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground font-medium flex items-center gap-3">
                        <span className="truncate">{branch.name}</span>
                        {branch.is_default && (
                          <span className="text-xs rounded bg-surface-300 px-1.5 py-0.5 text-foreground-light border border-default">
                            default
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-foreground-light font-mono break-all">
                        {branch.ref || branch.id}
                      </p>

                      {branch.created_at && (
                        <div className="text-xs text-foreground-lighter">
                          Created
                          <TimestampInfo
                            utcTimestamp={branch.created_at}
                            displayAs="local"
                            labelFormat="DD MMM HH:mm"
                            format="YYYY-MM-DD HH:mm:ss"
                          />
                        </div>  
                      )}
                    </div>

                    {/* Resource usage badge on the right */}
                    <div className="shrink-0 ml-2">
                      <BranchResourceBadge
                        max_resources={branch.max_resources}
                        used_resources={branch.used_resources}
                        size={36}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="tiny"
                      type="default"
                      onClick={() => onToggleBranch(branch)}
                      disabled={togglingId === branch.id || deletingId === branch.id}
                      loading={togglingId === branch.id}
                      aria-label={`${isBranchRunning(branch) ? 'Stop' : 'Start'} branch ${branch.name ?? branch.id}`}
                    >
                      {isBranchRunning(branch) ? (
                        <span className="inline-flex items-center gap-1">
                          <Pause size={14} /> Stop
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Play size={14} /> Start
                        </span>
                      )}
                    </Button>

                    <Button
                      size="tiny"
                      type="default"
                      className="text-red-600"
                      onClick={() =>
                        setDeleteTarget({
                          id: branch.id,
                          name: branch.name ?? branch.ref ?? branch.id,
                        })
                      }
                      disabled={togglingId === branch.id || deletingId === branch.id}
                      aria-label={`Delete branch ${branch.name ?? branch.id}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={14} /> Delete
                      </span>
                    </Button>
                    <ResizeBranchModal
                      orgSlug={slug}
                      projectRef={projectRef}
                      branchId={branch.id} 
                      triggerClassName="!ml-auto" 
                    />
                  </div>


                  <div className="pt-3">
                    <Button asChild size="tiny" type="default" block>
                      <Link
                        href={`/org/${slug}/project/${projectRef}/branch/${branch.ref ?? branch.id}`}
                      >
                        Open branch
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        size="medium"
        loading={false}
        visible={!!deleteTarget}
        title={
          deleteTarget ? `Delete branch “${deleteTarget.name}”?` : 'Delete branch'
        }
        confirmLabel="Delete branch"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={onConfirmDeleteBranch}
        variant="warning" // change to "danger" if your component supports it
      >
        <div className="text-sm text-foreground-light space-y-2">
          <p>
            This action permanently deletes the branch and its resources. This cannot be undone.
          </p>
          <p>Are you sure you want to proceed?</p>
        </div>
      </ConfirmationModal>
    </div>
  )
}

const ProjectStatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null

  const isHealthy = status === PROJECT_STATUS.STARTED
  const isInactive = status === PROJECT_STATUS.PAUSED
  const isComingUp = status === PROJECT_STATUS.STARTING

  if (isHealthy) {
    return (
      <p className="text-xs text-foreground-light">
        Status:{' '}
        <span className="inline-flex items-center rounded bg-surface-300 px-1.5 py-0.5 text-foreground border border-default">
          Active
        </span>
      </p>
    )
  }

  if (isComingUp) {
    return (
      <p className="text-xs text-foreground-light">
        Status:{' '}
        <span className="inline-flex items-center rounded bg-surface-300 px-1.5 py-0.5 text-foreground border border-default">
          Provisioning
        </span>
      </p>
    )
  }

  if (isInactive) {
    return (
      <p className="text-xs text-foreground-light">
        Status:{' '}
        <span className="inline-flex items-center rounded bg-surface-300 px-1.5 py-0.5 text-foreground border border-default">
          Paused
        </span>
      </p>
    )
  }

  return (
    <p className="text-xs text-foreground-light">
      Status:{' '}
      <span className="inline-flex items-center rounded bg-surface-300 px-1.5 py-0.5 text-foreground border border-default">
        {status}
      </span>
    </p>
  )
}

const HeaderSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 w-full">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded bg-surface-300 animate-pulse" />
          <div className="h-3 w-64 rounded bg-surface-300 animate-pulse" />
          <div className="h-4 w-24 rounded bg-surface-300 animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="h-8 w-32 rounded bg-surface-300 animate-pulse" />
          <div className="h-8 w-32 rounded bg-surface-300 animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-64 rounded bg-surface-300 animate-pulse" />
    </div>
  )
}

const BranchesSkeleton = () => {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <ShimmeringCard />
      <ShimmeringCard />
      <ShimmeringCard />
    </ul>
  )
}

const EmptyBranchesState = ({
  slug,
  projectRef,
  projectName,
}: {
  slug: string
  projectRef: string
  projectName: string
}) => {
  return (
    <div className="rounded border border-dashed p-6 text-center space-y-3 bg-surface-100">
      <p className="text-sm text-foreground">No branches found for this project</p>
      <p className="text-xs text-foreground-light">
        Branches let you isolate environments (preview, staging, prod, etc.)
      </p>
      <Button asChild type="default" size="tiny">
        <Link
          href={`/new/${slug}/${projectRef}?name=${encodeURIComponent(projectName + "'s branch")}`}
        >
          Create your first branch
        </Link>
      </Button>
    </div>
  )
}

ProjectOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ProjectOverviewPage
