import NewBranchForm from 'components/interfaces/Branch/NewBranchForm'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import WizardLayout from 'components/layouts/WizardLayout'
import type { NextPageWithLayout } from 'types'

/**
 * No branch, create a new one
 */
const CloneBranchPage: NextPageWithLayout = () => {
  return (
    <>
      <NewBranchForm />
    </>
  )
}

CloneBranchPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Clone branch">
      <WizardLayout>{page}</WizardLayout>
    </DefaultLayout>
  </AppLayout>
)

export default CloneBranchPage
