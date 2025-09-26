import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Admonition } from 'ui-patterns'
import { DeleteOrganizationButton } from './DeleteOrganizationButton'

const OrganizationDeletePanel = () => {
  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Danger Zone</ScaffoldSectionTitle>
      <Admonition
        type="destructive"
        title="Deleting this organization will also remove its projects"
        description="Make sure you have made a backup of your projects if you want to keep your data"
      >
        <DeleteOrganizationButton />
      </Admonition>
    </ScaffoldSection>
  )
}

export default OrganizationDeletePanel
