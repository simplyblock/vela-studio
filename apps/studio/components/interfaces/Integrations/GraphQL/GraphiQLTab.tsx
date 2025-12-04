import '@graphiql/react/style.css'
import { createGraphiQLFetcher, Fetcher } from '@graphiql/toolkit'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import GraphiQL from 'components/interfaces/GraphQL/GraphiQL'
import { Loading } from 'components/ui/Loading'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { API_URL } from 'lib/constants'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { useGetImpersonatedRoleState } from 'state/role-impersonation-state'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

export const GraphiQLTab = () => {
  const { resolvedTheme } = useTheme()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: branch } = useSelectedBranchQuery()
  const currentTheme = useMemo(
    () => (resolvedTheme?.includes('dark') ? 'dark' : 'light'),
    [resolvedTheme]
  )

  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: true })

  const { data: apiKeys, isFetched } = useAPIKeysQuery({ branch, reveal: true })
  const { serviceKey, secretKey } = getKeys(apiKeys)

  const { data: config } = useProjectPostgrestConfigQuery({ branch })
  const jwtSecret = config?.jwt_secret

  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const fetcher = useMemo(() => {
    const fetcherFn = createGraphiQLFetcher({
      // [Joshen] Opting to hard code /platform for local to match the routes, so that it's clear what's happening
      url: `${API_URL}/platform/organizations/${orgRef}/projects/${projectRef}/branches/${branchRef}/api/graphql`,
      fetch,
    })
    const customFetcher: Fetcher = async (graphqlParams, opts) => {
      let userAuthorization: string | undefined

      const role = getImpersonatedRoleState().role
      if (
        projectRef !== undefined &&
        jwtSecret !== undefined &&
        role !== undefined &&
        role.type === 'postgrest'
      ) {
        try {
          const token = await getRoleImpersonationJWT(projectRef, jwtSecret, role)
          userAuthorization = 'Bearer ' + token
        } catch (err: any) {
          toast.error(`Failed to get JWT for role: ${err.message}`)
        }
      }

      return fetcherFn(graphqlParams, {
        ...opts,
        headers: {
          ...opts?.headers,
          ...(accessToken && {
            Authorization: `Bearer ${accessToken}`,
          }),
          'x-graphql-authorization':
            opts?.headers?.['Authorization'] ??
            opts?.headers?.['authorization'] ??
            userAuthorization ??
            `Bearer ${secretKey?.api_key ?? serviceKey?.api_key}`,
        },
      })
    }

    return customFetcher
  }, [orgRef, projectRef, branchRef, getImpersonatedRoleState, jwtSecret, accessToken, serviceKey, secretKey?.api_key])

  if (!accessToken || !isFetched) {
    return <Loading />
  }

  return <GraphiQL fetcher={fetcher} theme={currentTheme} />
}
