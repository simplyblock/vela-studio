import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import OrganizationDeletePanel from './OrganizationDeletePanel'

import { OrganizationDetailsForm } from './OrganizationDetailsForm'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const GeneralSettings = () => {
  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')
  const canDeleteOrganization = useCheckPermissions("org:owner:admin")

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
