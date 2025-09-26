import { createClient } from '@supabase/supabase-js'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

// FIXME: Remove the use of the supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { path } = req.body

  const { data } = supabase.storage.from(id as string).getPublicUrl(path)

  const publicUrl = new URL(data.publicUrl)
  const parsed = new URL(process.env.VELA_PLATFORM_EXT_BASE_URL!)
  publicUrl.protocol = parsed.protocol
  publicUrl.host = parsed.host
  publicUrl.port = parsed.port
  data.publicUrl = publicUrl.href

  return res.status(200).json(data)
}
