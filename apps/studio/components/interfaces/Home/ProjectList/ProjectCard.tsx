import { GitBranch, Github } from 'lucide-react'

import CardButton from 'components/ui/CardButton'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import type { ProjectInfo } from 'data/projects/projects-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'
import { useParams } from 'common'
import { useBranchesQuery } from '../../../../data/branches/branches-query'

export interface ProjectCardProps {
  project: ProjectInfo
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

const ProjectCard = ({
  project,
  githubIntegration,
  resourceWarnings,
}: ProjectCardProps) => {
  const { slug: orgRef } = useParams() as { slug: string }
  const { name, ref: projectRef, default_branch } = project

  const { data: branches } = useBranchesQuery({orgSlug: orgRef, projectRef})
  const mainBranch = branches?.find(branch => branch.name === default_branch)

  const isBranchingEnabled = true
  const isGithubIntegrated = githubIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined
  const projectStatus = inferProjectStatus(project)

  if (!mainBranch) console.error('No main branch found for project', project)

  return (
    <li className="list-none">
      <CardButton
        linkHref={`/org/${orgRef}/project/${projectRef}/branch/${mainBranch?.id}`}
        className="h-44 !px-0 group pt-5 pb-0"
        title={
          <div className="w-full justify-between space-y-1.5 px-5">
            <p className="flex-shrink truncate text-sm pr-4">{name}</p>
            <span className="text-sm lowercase text-foreground-light">Reference: {project.ref}</span>
            <div className="flex items-center gap-x-1.5">
              {project.status !== 'INACTIVE' && <ComputeBadgeWrapper project={project} />}
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
                  <p className="text-xs !ml-2 text-foreground-light truncate">{githubRepository}</p>
                </>
              )}
            </div>
          </div>
        }
        footer={
          <ProjectCardStatus projectStatus={projectStatus} resourceWarnings={resourceWarnings} />
        }
        containerElement={<ProjectIndexPageLink slug={orgRef} projectRef={projectRef} />}
      />
    </li>
  )
}

export default ProjectCard
