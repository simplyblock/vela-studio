import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
} from 'ui'
import InstanceConfiguration from './InfrastructureConfiguration/InstanceConfiguration'

const InfrastructureInfo = () => {
  const { data: project } = useSelectedProjectQuery()

  const isInactive = project?.status === 'INACTIVE'

  return (
    <>
      <ScaffoldDivider />
      {project?.cloud_provider !== 'FLY' && (
        <>
          <InstanceConfiguration />
          <ScaffoldDivider />
        </>
      )}

      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            <p>Service Versions</p>
            <p className="text-foreground-light text-sm">
              Information on your provisioned instance
            </p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            {isInactive ? (
              <Alert_Shadcn_>
                <AlertTitle_Shadcn_>
                  Service versions cannot be retrieved while project is paused
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Restoring the project will update Postgres to the newest version
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : null}
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

export default InfrastructureInfo
