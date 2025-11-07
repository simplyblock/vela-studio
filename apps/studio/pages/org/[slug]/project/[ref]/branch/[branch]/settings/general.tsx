import {
  General,
} from 'components/interfaces/Settings/General'
import { DeleteProjectPanel } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectPanel'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Branch Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <General />

        {/* FIXME: Disabled since don't have branch transfer right now */ }
        {/* branchTransferEnabled && <TransferBranchPanel /> */}
        <DeleteProjectPanel />
      </ScaffoldContainer>
    </>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="General">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ProjectSettings
