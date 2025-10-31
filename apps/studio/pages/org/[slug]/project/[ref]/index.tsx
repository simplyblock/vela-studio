import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/router'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { PROJECT_STATUS } from 'lib/constants'

import AlertError from 'components/ui/AlertError'

import { Button, cn } from 'ui'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import type { NextPageWithLayout } from 'types'
import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'

const ProjectOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, ref: projectRef } = useParams() as { slug: string; ref?: string }

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
              <Button asChild type="default">
                <Link href={`/org/${slug}/project/${projectRef}/settings`}>Project settings</Link>
              </Button>

              <Button asChild type="default">
                <Link href={`/org/${slug}/project/${projectRef}/resource-limits`}>
                  Resource limits
                </Link>
              </Button>
            </div>
          </div>

          <ProjectUpgradeFailedBanner />
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

            <Button asChild type="default">
              <Link href={`/org/${slug}/project/${projectRef}/settings`}>Manage branches</Link>
            </Button>
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
                  <div className="space-y-1">
                    <p className="text-sm text-foreground font-medium flex items-center justify-between">
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
                      <p className="text-xs text-foreground-lighter">
                        Created {branch.created_at}
                        {/* TODO: format date pretty if you have a util */}
                      </p>
                    )}
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
