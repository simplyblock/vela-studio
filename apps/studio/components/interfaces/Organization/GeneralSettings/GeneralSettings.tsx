import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import OrganizationDeletePanel from './OrganizationDeletePanel'

import { OrganizationDetailsForm } from './OrganizationDetailsForm'

const GeneralSettings = () => {
  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')
  // FIXME: need permission implemented 
  const canDeleteOrganization = true

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Organization Details</ScaffoldSectionTitle>
        <OrganizationDetailsForm />
      </ScaffoldSection>

      {organizationDeletionEnabled && canDeleteOrganization && <OrganizationDeletePanel />}
    </ScaffoldContainer>
  )
}

export default GeneralSettings
