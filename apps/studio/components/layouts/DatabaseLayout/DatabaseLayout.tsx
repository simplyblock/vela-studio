import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useIsColumnLevelPrivilegesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateDatabaseMenu } from './DatabaseMenu.utils'
import { getOrganizationSlug } from '../../../data/vela/organization-path-slug'

export interface DatabaseLayoutProps {
  title?: string
}

const DatabaseProductMenu = () => {
  const { data: project } = useSelectedProjectQuery()

  const router = useRouter()
  const slug = getOrganizationSlug() || 'unknown'

  const page = router.pathname.split('/')[6]

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgNetExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_net') !== undefined
  const pitrEnabled = true
  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()
  const enablePgReplicate = useFlag('enablePgReplicate')

  const { databaseReplication: showPgReplicate, databaseRoles: showRoles } = useIsFeatureEnabled([
    'database:replication',
    'database:roles',
  ])

  return (
    <>
      <ProductMenu
        page={page}
        menu={generateDatabaseMenu(slug, project, {
          pgNetExtensionExists,
          pitrEnabled,
          columnLevelPrivileges,
          enablePgReplicate,
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
