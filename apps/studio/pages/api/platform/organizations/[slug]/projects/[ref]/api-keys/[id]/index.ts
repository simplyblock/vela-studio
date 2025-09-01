import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, id } = getPlatformQueryParams(req, 'slug', 'ref', 'id')

  // Return empty data structure that prevents null/undefined access
  return res.status(200).json({
    data: {
      id: id,
      name: '',
      key: '',
      projectRef: ref,
      organizationSlug: slug,
      createdAt: '',
      updatedAt: '',
      lastUsedAt: null,
      permissions: [],
      tags: [],
      status: 'active',
    },
    error: null,
  })
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, id } = getPlatformQueryParams(req, 'slug', 'ref', 'id')

  // Return empty response that prevents null/undefined access
  return res.status(200).json({
    data: {
      id: id,
      name: '',
      key: '',
      projectRef: ref,
      organizationSlug: slug,
      createdAt: '',
      updatedAt: '',
      lastUsedAt: null,
      permissions: [],
      tags: [],
      status: 'active',
    },
    error: null,
  })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, id } = getPlatformQueryParams(req, 'slug', 'ref', 'id')

  // Return empty response that prevents null/undefined access
  return res.status(200).json({
    data: true,
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).patch(handlePatch).delete(handleDelete)
})

export default apiHandler
