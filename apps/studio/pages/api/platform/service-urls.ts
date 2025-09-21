import { NextApiRequest, NextApiResponse } from 'next'
import { VELA_PLATFORM_EXT_KEYCLOAK_URL } from '../constants'

interface ServiceUrlsResponse {
  signInUrl: string
}

const handleGet = (req: NextApiRequest, res: NextApiResponse<ServiceUrlsResponse>) => {
  return res.status(200).json({
    signInUrl: VELA_PLATFORM_EXT_KEYCLOAK_URL!
  })
}