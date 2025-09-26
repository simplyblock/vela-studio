import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../lib/api/apiBuilder'
import { ServiceUrlsResponse } from 'common/hooks/useServiceUrls'

const extPlatformSignInUrl = process.env.VELA_PLATFORM_EXT_SIGN_IN_URL
if (!extPlatformSignInUrl) throw new Error('Missing VELA_PLATFORM_EXT_SIGN_IN_URL')

const extPlatformBaseUrl = process.env.VELA_PLATFORM_EXT_BASE_URL
if (!extPlatformBaseUrl) throw new Error('Missing VELA_PLATFORM_EXT_BASE_URL')

const extPlatformApiServiceUrl = process.env.VELA_PLATFORM_EXT_API_SERVICE_URL
if (!extPlatformApiServiceUrl) throw new Error('Missing VELA_PLATFORM_EXT_API_SERVICE_URL')

const handleGet = (req: NextApiRequest, res: NextApiResponse<ServiceUrlsResponse>) => {
  return res.status(200).json({
    platformBaseUrl: extPlatformBaseUrl,
    platformSignInUrl: extPlatformSignInUrl,
    platformApiServiceUrl: extPlatformApiServiceUrl
  })
}

const apiHandler = apiBuilder(builder => builder.get(handleGet))

export default apiHandler
