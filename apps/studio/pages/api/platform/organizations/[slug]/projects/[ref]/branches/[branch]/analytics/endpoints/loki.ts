import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { LOKI_URL } from '../../../../../../../../../constants'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const { body } = req

  const response = await fetch(`${LOKI_URL}/loki/api/v1/query_range`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      start: body.iso_timestamp_start,
      end: body.iso_timestamp_end,
      query: body.query,
      direction: 'backward',
    }),
  })

  if (!response.ok) {
    return res.status(response.status).json({ error: await response.text() })
  }

  return res.status(200).json(await response.json())
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
