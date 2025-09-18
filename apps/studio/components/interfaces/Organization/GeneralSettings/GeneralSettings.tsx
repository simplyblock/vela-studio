import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import OrganizationDeletePanel from './OrganizationDeletePanel'

import { OrganizationDetailsForm } from './OrganizationDetailsForm'

const GeneralSettings = () => {
  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')

  const canDeleteOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')

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
