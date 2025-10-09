import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { proxyWithMapping } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { deepObjectFilter } from 'lib/api/apiFilters'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  return await proxyWithMapping(
    req,
    res,
    'get',
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/identity-provider/instances',
    (value) => {
      if (value === undefined) return undefined
      return value.map((item) => {
        return deepObjectFilter(item, [
          'internalId',
          'updateProfileFirstLoginMode',
          'storeToken',
          'addReadTokenRoleOnCreate',
          'authenticateByDefault',
          'hideOnLogin',
          'firstBrokerLoginFlowAlias',
          'postBrokerLoginFlowAlias',
          'organizationId',
          'updateProfileFirstLogin',
        ])
      })
    },
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
        },
      },
    }
  )
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
