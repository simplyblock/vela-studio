import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateDatabaseMenu } from './DatabaseMenu.utils'
import { getOrganizationSlug } from 'data/vela/organization-path-slug'
import { useParams } from 'common'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

export interface DatabaseLayoutProps {
  title?: string
}

import { useBranchProductPage } from '../../../hooks/misc/useBranchProductPage'

const DatabaseProductMenu = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()
  const { branch: branchRef } = useParams()

  const router = useRouter()
  const slug = getOrganizationSlug() || 'unknown'

  const { page } = useBranchProductPage()

  const { data } = useDatabaseExtensionsQuery({
    branch
  })

  const pitrEnabled = true

  const { databaseRoles: showRoles } = useIsFeatureEnabled([
    'database:replication',
    'database:roles',
  ])
  const showPgReplicate = false

  return (
    <>
      <ProductMenu
        page={page}
        menu={generateDatabaseMenu(slug, project, branchRef, {
          pitrEnabled,
          showPgReplicate,
          showRoles,
        })}
      />
    </>
  )
}

const DatabaseLayout = ({ children }: PropsWithChildren<DatabaseLayoutProps>) => {
  return (
    <ProjectLayout product="Database" productMenu={<DatabaseProductMenu />} isBlocking={false}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(DatabaseLayout)
