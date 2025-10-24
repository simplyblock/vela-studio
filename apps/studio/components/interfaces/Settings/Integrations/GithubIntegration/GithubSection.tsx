import { useMemo } from 'react'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { GenericSkeletonLoader } from 'ui-patterns'
import GitHubIntegrationConnectionForm from './GitHubIntegrationConnectionForm'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-full sm:w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const GitHubSection = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { can: canReadGitHubConnection, isLoading: isLoadingPermissions } = useCheckPermissions("org:settings:read")

  const { data: connections } = useGitHubConnectionsQuery(
    { organizationId: organization?.id },
    { enabled: !!projectRef && !!organization?.id }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const GitHubTitle = `GitHub Integration`

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={GitHubTitle}>
          <p>Connect any of your GitHub repositories to a project.</p>
          <IntegrationImageHandler title="github" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoadingPermissions ? (
            <GenericSkeletonLoader />
          ) : !canReadGitHubConnection ? (
            <NoPermission resourceText="view this organization's GitHub connections" />
          ) : (
            <div className="space-y-6">
              <div>
                <h5 className="text-foreground mb-2">How does the GitHub integration work?</h5>
                <p className="text-foreground-light text-sm mb-6">
                  Connecting to GitHub allows you to sync preview branches with a chosen GitHub
                  branch, keep your production branch in sync, and automatically create preview
                  branches for every pull request.
                </p>
                <div>
                  <GitHubIntegrationConnectionForm connection={existingConnection} />
                </div>
              </div>
            </div>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default GitHubSection
