import dynamic from 'next/dynamic'
import { forwardRef, HTMLAttributes, useMemo } from 'react'

import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { pluckObjectFields } from 'lib/helpers'
import { cn } from 'ui'
import type { projectKeys } from './Connect.types'
import { getConnectionStrings } from './DatabaseSettings.utils'

interface ConnectContentTabProps extends HTMLAttributes<HTMLDivElement> {
  projectKeys: projectKeys
  filePath: string
  connectionStringPooler?: {
    transactionShared: string
    sessionShared: string
    transactionDedicated?: string
    sessionDedicated?: string
    direct?: string
  }
}

const ConnectTabContent = forwardRef<HTMLDivElement, ConnectContentTabProps>(
  ({ projectKeys, filePath, ...props }, ref) => {
    const { slug: orgSlug, ref: projectRef } = useParams()

    const { data: settings } = useProjectSettingsV2Query({ orgSlug, projectRef })
    const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ orgSlug, projectRef })

    const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
    const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
    const connectionInfo = pluckObjectFields(settings || emptyState, DB_FIELDS)
    const poolingConfigurationDedicated = pgbouncerConfig

    const connectionStringsShared = getConnectionStrings({
      connectionInfo,
      poolingInfo: {
        connectionString: '',
        db_host: '',
        db_name: '',
        db_port: 0,
        db_user: '',
      },
      metadata: { projectRef },
    })

    const connectionStringsDedicated =
      poolingConfigurationDedicated !== undefined
        ? getConnectionStrings({
            connectionInfo,
            poolingInfo: {
              connectionString: poolingConfigurationDedicated.connection_string,
              db_host: poolingConfigurationDedicated.db_host,
              db_name: poolingConfigurationDedicated.db_name,
              db_port: poolingConfigurationDedicated.db_port,
              db_user: poolingConfigurationDedicated.db_user,
            },
            metadata: { projectRef },
          })
        : undefined

    const ContentFile = useMemo(() => {
      return dynamic<ConnectContentTabProps>(() => import(`./content/${filePath}/content`), {
        loading: () => (
          <div className="p-4 min-h-[331px]">
            <GenericSkeletonLoader />
          </div>
        ),
      })
    }, [filePath])

    return (
      <div ref={ref} {...props} className={cn('border rounded-lg', props.className)}>
        <ContentFile
          projectKeys={projectKeys}
          filePath={filePath}
          connectionStringPooler={{
            transactionShared: connectionStringsShared.pooler.uri,
            sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
            transactionDedicated: connectionStringsDedicated?.pooler.uri,
            sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
            direct: connectionStringsShared.direct.uri,
          }}
        />
      </div>
    )
  }
)

ConnectTabContent.displayName = 'ConnectTabContent'

export default ConnectTabContent
