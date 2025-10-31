import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from '../api/platformQueryParams'
import { isDocker } from '../docker'
import { getVelaClient, maybeHandleError } from 'data/vela/vela'
import { getBranchOrRefresh } from '../api/branchCaching'

const isInDocker = isDocker()

const DEFAULT_SEARCH_OPTIONS = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: 'name',
    order: 'asc',
  },
}

export async function newStorageClient(req: NextApiRequest, res: NextApiResponse) {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const branchEntity = await getBranchOrRefresh(slug, ref, branch, async () => {
    const client = getVelaClient(req)
    const response = await client.get(
      '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/',
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
    if (maybeHandleError(res, response)) return
    return response.data!
  })

  if (!branchEntity) return

  const token = !isInDocker
    ? branchEntity.api_keys.service_role!
    : process.env.SUPABASE_SERVICE_KEY!
  const storageEndpoint = !isInDocker
    ? `${branchEntity.database.service_endpoint_uri}/storage`
    : 'http://storage:5000'

  return {
    getBuckets: async () => {
      const response = await fetch(`${storageEndpoint}/bucket`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 404) {
        return res.status(200).json([])
      }
      if (response.status !== 200) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    createBucket: async (name: string, isPublic: boolean) => {
      const response = await fetch(`${storageEndpoint}/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          public: isPublic,
        }),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    deleteBucket: async (name: string) => {
      const response = await fetch(`${storageEndpoint}/bucket/${name}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    updateBucket: async (name: string, isPublic: boolean) => {
      const response = await fetch(`${storageEndpoint}/bucket/${name}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public: isPublic,
        }),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    emptyBucket: async (name: string) => {
      const response = await fetch(`${storageEndpoint}/bucket/${name}/empty`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    listObjects: async (name: string) => {
      const { path, options } = req.body
      const body = { ...DEFAULT_SEARCH_OPTIONS, ...options, prefix: path || '' }
      const response = await fetch(`${storageEndpoint}/object/list/${name}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    deleteObject: async (name: string, paths: string[]) => {
      const response = await fetch(`${storageEndpoint}/object/${name}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: paths }),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },
  }
}
