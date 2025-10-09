import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient, maybeHandleError } from 'data/vela/vela'
import { mapProject } from 'data/vela/api-mappers'
import { ProjectCreateVariables } from 'data/projects/project-create-mutation'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = getVelaClient(req)
  const { slug } = getPlatformQueryParams(req, 'slug')
  const creationRequest = req.body as ProjectCreateVariables

  const createResponse = await client.post('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
    body: {
      // FIXME: get correct values from the UI (after implemented in new/[slug].tsx
      name: creationRequest.name,
      deployment: {
        database: '',
        database_user: '',
        database_password: '',
        database_size: 10000000000000,
        storage_size: 1000000000000,
        milli_vcpu: 10000,
        memory_bytes: 500000000,
        iops: 1000000,
        database_image_tag: '15.1.0.147',
      },
    },
  })

  if (createResponse.response.status !== 201) {
    return res
      .status(createResponse.response.status)
      .send({ message: createResponse.error?.detail ?? 'Unknown error' })
  }

  const location = createResponse.response.headers.get('location')
  if (!location) {
    return res.status(500).send({ message: 'No location header' })
  }

  const projectId = location.slice(0, -1).split('/').pop()
  const readResponse = await client.get(
    '/organizations/{organization_id}/projects/{project_id}/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: projectId!,
        },
      },
    }
  )

  if (maybeHandleError(res, readResponse)) {
    return
  }

  return res.status(200).json(mapProject(readResponse.data!))
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data.map(mapProject))
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGetAll).post(handleCreate))

export default apiHandler
