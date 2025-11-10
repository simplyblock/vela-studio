import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { mapOrganization } from 'data/vela/api-mappers'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = getVelaClient(req)

  const { data, success } = await client.postOrFail(res, '/organizations/', {
    params: {
      query: {
        response: 'full'
      }
    },
    body: {
      name: req.body.name,
      max_backups: req.body.max_backups,
      environments: req.body.env_types ? req.body.env_types?.join(';') : undefined,
    }
  })

  if (!success) {
    return
  }

  return res.status(201).json(mapOrganization(data!))
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = getVelaClient(req)
  const response = await client.get('/organizations/')

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data.map(mapOrganization))
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGetAll).post(handleCreate))

export default apiHandler
