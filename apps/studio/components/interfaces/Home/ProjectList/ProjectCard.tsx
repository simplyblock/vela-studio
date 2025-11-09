import { GitBranch, Github } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import CardButton from 'components/ui/CardButton'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import type { ProjectInfo } from 'data/projects/projects-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'
import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { Button } from 'ui'
import ProjectResourcesBadge from 'components/interfaces/Project/ProjectResourcesBadge'

export interface ProjectCardProps {
  project: ProjectInfo
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

const ProjectCard = ({ project, githubIntegration, resourceWarnings }: ProjectCardProps) => {
  const { slug: orgRef } = useParams() as { slug: string }
  const { name, id: projectRef, default_branch_id } = project

  const { data: branches, isLoading } = useBranchesQuery({ orgRef: orgRef, projectRef })
  const mainBranch = branches?.find((branch) => branch.id === default_branch_id)
  const onlyBranch = branches?.length === 1 ? branches[0] : undefined
  const branchesCount = branches?.length ?? 0

  const hasBranches = branchesCount > 0
  const selectedBranchId = mainBranch?.id ?? onlyBranch?.id ?? undefined
  const selectedBranchName = mainBranch?.name ?? onlyBranch?.name ?? undefined

  const isBranchingEnabled = true
  const isGithubIntegrated = githubIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined
  const projectStatus = inferProjectStatus(project)

  // Where the card click goes
  const branchLink = useMemo(() => {
    if (selectedBranchId) {
      return `/org/${orgRef}/project/${projectRef}/branch/${selectedBranchId}`
    }
    return `/new/${orgRef}/${projectRef}`
  }, [selectedBranchId, orgRef, projectRef])

  // Where the "View branches" button goes (project overview)
  const allBranchesHref = `/org/${orgRef}/project/${projectRef}`

  // Prevent inner buttons from triggering the card's navigation
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <li className="list-none">
      {isLoading ? (
        <ShimmeringLoader className="w-full h-[32px] p-0" />
      ) : (
        <CardButton
          linkHref={branchLink}
          className="h-44 !px-0 group pt-5 pb-0"
          title={
            <div className="w-full justify-between space-y-2 px-5">
              {/* Top row: Name + right-side small items */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">{name}</p>
                  <span className="text-xs lowercase text-foreground-light block mt-1">
                    reference: {project.id}
                  </span>
                </div>

                {/* Right side — small inline badges (kept compact) */}
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {/* Project-level resources badge (small) */}
                  <div className="flex items-center justify-center mt-5">
                    <ProjectResourcesBadge orgRef={orgRef} projectRef={projectRef} size={28} />
                  </div>
                </div>
              </div>

              {/* Badges row (icons + repo name) */}
              <div className="flex items-center gap-x-1.5">
                {isBranchingEnabled && (
                  <div className="w-fit p-1 border rounded-md flex items-center">
                    <GitBranch size={12} strokeWidth={1.5} />
                  </div>
                )}

                {isGithubIntegrated && (
                  <>
                    <div className="w-fit p-1 border rounded-md flex items-center">
                      <Github size={12} strokeWidth={1.5} />
                    </div>
                    <p className="text-xs !ml-2 text-foreground-light truncate">
                      {githubRepository}
                    </p>
                  </>
                )}
              </div>

              {/* Behavior hint + inline actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[11px] leading-snug text-foreground-muted truncate">
                  {hasBranches ? (
                    <>
                      Opens{' '}
                      <span className="font-medium">
                        {selectedBranchName ?? 'default branch'}
                      </span>{' '}
                      on click &middot; {branchesCount} branch
                      {branchesCount === 1 ? '' : 'es'} total
                    </>
                  ) : (
                    <>No branches yet &middot; opens the New Branch flow on click</>
                  )}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={allBranchesHref} onClick={stop}>
                    <Button type="default" size="tiny">
                      View branches
                    </Button>
                  </Link>

                  {!hasBranches && (
                    <Link href={`/new/${orgRef}/${projectRef}`} onClick={stop}>
                      <Button type="primary" size="tiny">
                        Create branch
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          }
          footer={
            <ProjectCardStatus projectStatus={projectStatus} resourceWarnings={resourceWarnings} />
          }
          containerElement={<ProjectIndexPageLink slug={orgRef} projectRef={projectRef} />}
        />
      )}
    </li>
  )
}

export default ProjectCard
