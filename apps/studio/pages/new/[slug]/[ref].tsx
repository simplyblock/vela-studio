import NewBranchForm from 'components/interfaces/Branch/NewBranchForm'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import WizardLayout from 'components/layouts/WizardLayout'
import type { NextPageWithLayout } from 'types'

/**
 * No branch, create a new one
 */
const CreateBranchPage: NextPageWithLayout = () => {
  return (
    <>
      <NewBranchForm />
    </>
  )
}

CreateBranchPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="New branch">
      <WizardLayout>{page}</WizardLayout>
    </DefaultLayout>
  </AppLayout>
)

export default CreateBranchPage
