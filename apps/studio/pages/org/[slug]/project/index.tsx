import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { Admonition } from 'ui-patterns'
import { InlineLink } from 'components/ui/InlineLink'
import AlertError from 'components/ui/AlertError'
import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import { Button, cn } from 'ui'

import { useIsMFAEnabled, useParams } from 'common'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

/**
 * TEMP LAYOUT WRAPPER
 * This shell exists to give the page correct outer chrome and sidebar context.
 * Replace with your real "ProjectLayout" once you have the project-level sidebar wired in.
 *
 * Usage mirrors OrganizationLayout in your ProjectsPage, but this one is for a single project scope.
 */
const ProjectLayoutShell = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col">{children}</div>
}

const ProjectOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug: orgSlug, projectRef } = useParams() as {
    slug: string
    projectRef?: string
  }

  // org lock / MFA gating (same pattern as ProjectsPage)
  const { data: org } = useSelectedOrganizationQuery()
  const isUserMFAEnabled = useIsMFAEnabled()
  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  // project info
  const {
    data: project,
    isLoading: isLoadingProject,
    isError: isErrorProject,
    error: projectError,
  } = useSelectedProjectQuery()

  // branches under this project
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    error: branchesError,
  } = useBranchesQuery(
    { orgSlug, projectRef },
    { enabled: !!orgSlug && !!projectRef }
  )

  // resource warnings (quota, limits, etc)
  const {
    data: resourceWarnings = [],
    isLoading: isLoadingWarnings,
    isError: isErrorWarnings,
    error: warningsError,
  } = useResourceWarningsQuery()

  // Derive "this project's" resource warning if you want to surface it here
  const projectWarning = useMemo(() => {
    if (!project?.id) return undefined
    return resourceWarnings.find((w) => w.project === project.id)
  }, [project?.id, resourceWarnings])

  // Basic loading state while we grab project + branches
  if (isLoadingProject || isLoadingBranches || !projectRef || !orgSlug) {
    return (
      <ScaffoldContainer>
        <div className="space-y-6">
          <HeaderSkeleton />
          <BranchesSkeleton />
        </div>
      </ScaffoldContainer>
    )
  }

  // MFA restriction state (org enforced MFA)
  if (disableAccessMfa) {
    return (
      <ScaffoldContainer>
        <Admonition
          type="note"
          title={`The organization "${org?.name}" has MFA enforced`}
        >
          <p className="!m-0">
            Set up MFA on your account through your{' '}
            <InlineLink href="/account/security">account preferences</InlineLink>{' '}
            to access this project.
          </p>
        </Admonition>
      </ScaffoldContainer>
    )
  }

  // Error states
  if (isErrorProject) {
    return (
      <ScaffoldContainer>
        <AlertError
          subject="Failed to load project details"
          error={projectError}
        />
      </ScaffoldContainer>
    )
  }

  if (isErrorBranches) {
    return (
      <ScaffoldContainer>
        <AlertError
          subject="Failed to load branches for this project"
          error={branchesError}
        />
      </ScaffoldContainer>
    )
  }

  // Page content
  return (
    <ScaffoldContainer className="space-y-8">
      {/* Header / high level info about the project */}
      <section className="space-y-2">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <div className="space-y-1">
            <h1 className="text-xl font-medium text-foreground">
              {project?.name ?? projectRef}
            </h1>
            <p className="text-sm text-foreground-light">
              Project ref:{' '}
              <span className="font-mono text-xs">{projectRef}</span>
            </p>

            <ProjectStatusBadge status={project?.status} />

            {projectWarning && (
              <p className="text-xs text-warning-900">
                {'This project has active resource warnings.'}
              </p>
            )}
          </div>

          <div className="flex flex-row gap-2 flex-wrap">
            <Button
              asChild
              type="default"
            >
              <Link
                href={`/org/${orgSlug}/project/${projectRef}/settings`}
              >
                Project settings
              </Link>
            </Button>

            <Button
              asChild
              type="default"
            >
              <Link
                href={`/org/${orgSlug}/project/${projectRef}/resource-limits`}
              >
                Resource limits
              </Link>
            </Button>
          </div>
        </div>

        {isErrorWarnings && (
          <AlertError
            subject="Failed to load resource warnings"
            error={warningsError}
          />
        )}
      </section>

      {/* Branch list */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-foreground">
              Branches
            </h2>
            <p className="text-sm text-foreground-light">
              Each branch is an isolated environment of this project.
            </p>
          </div>

          <Button
            asChild
            type="default"
          >
            <Link
              href={`/org/${orgSlug}/project/${projectRef}/settings`}
            >
              Manage branches
            </Link>
          </Button>
        </div>

        {branches.length === 0 ? (
          <EmptyBranchesState
            orgSlug={orgSlug}
            projectRef={projectRef}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <li
                key={branch.id}
                className={cn(
                  'rounded border border-default bg-surface-100 p-4 flex flex-col justify-between'
                )}
              >
                <div className="space-y-1">
                  <p className="text-sm text-foreground font-medium flex items-center justify-between">
                    <span className="truncate">{branch.name}</span>
                  </p>

                  <p className="text-xs text-foreground-light font-mono break-all">
                    {branch.id}
                  </p>

                  {branch.created_at && (
                    <p className="text-xs text-foreground-lighter">
                      Created {branch.created_at}
                      {/* You can pretty-format this if you have a date util */}
                    </p>
                  )}
                </div>

                <div className="pt-3">
                  <Button
                    asChild
                    size="tiny"
                    type="default"
                    block
                  >
                    <Link
                      href={`/org/${orgSlug}/project/${projectRef}/branch/${branch.id}`}
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
    </ScaffoldContainer>
  )
}

/* -------------------------------------------------
 * Supporting UI bits
 * ------------------------------------------------*/

const ProjectStatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null

  const isHealthy = status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isInactive = status === PROJECT_STATUS.INACTIVE
  const isComingUp = status === PROJECT_STATUS.COMING_UP

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
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-5 w-40 rounded bg-surface-300 animate-pulse" />
        <div className="h-3 w-64 rounded bg-surface-300 animate-pulse" />
        <div className="h-4 w-24 rounded bg-surface-300 animate-pulse" />
      </div>

      <div className="flex flex-row gap-2">
        <ShimmeringButton />
        <ShimmeringButton />
      </div>
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

const ShimmeringButton = () => (
  <div className="h-8 w-32 rounded bg-surface-300 animate-pulse" />
)

const EmptyBranchesState = ({
  orgSlug,
  projectRef,
}: {
  orgSlug: string
  projectRef: string
}) => {
  return (
    <div className="rounded border border-dashed p-6 text-center space-y-3 bg-surface-100">
      <p className="text-sm text-foreground">
        No branches found for this project
      </p>
      <p className="text-xs text-foreground-light">
        Branches let you isolate environments (preview, staging, prod, etc.)
      </p>
      <Button
        asChild
        type="default"
        size="tiny"
      >
        <Link
          href={`/org/${orgSlug}/project/${projectRef}/settings`}
        >
          Create / manage branches
        </Link>
      </Button>
    </div>
  )
}

/* -------------------------------------------------
 * Layout wiring
 * ------------------------------------------------*/

ProjectOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    {/* In the future you’ll likely have a <ProjectLayout> here
       that sets up the new ProjectSidebarLinks.
       We're stubbing it so you can land the page now. */}
    <ProjectLayoutShell>{page}</ProjectLayoutShell>
  </DefaultLayout>
)

export default ProjectOverviewPage
