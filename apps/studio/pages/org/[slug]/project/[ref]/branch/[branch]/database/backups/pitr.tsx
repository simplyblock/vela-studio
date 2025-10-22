import { BranchBackups } from 'components/interfaces/Database/Backups/Branch'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const BranchBackupsPage: NextPageWithLayout = () => {
  return <BranchBackups />
}

BranchBackupsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default BranchBackupsPage
