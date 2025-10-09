import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

interface Response {
  current_app_version: string
  /** @enum {string} */
  current_app_version_release_channel:
    | 'internal'
    | 'alpha'
    | 'beta'
    | 'ga'
    | 'withdrawn'
    | 'preview'
  duration_estimate_hours: number
  eligible: boolean
  latest_app_version: string
  legacy_auth_custom_roles: string[]
  objects_to_be_dropped: string[]
  target_upgrade_versions: {
    app_version: string
    /** @enum {string} */
    postgres_version: '13' | '14' | '15' | '17'
    /** @enum {string} */
    release_channel: 'internal' | 'alpha' | 'beta' | 'ga' | 'withdrawn' | 'preview'
  }[]
  unsupported_extensions: string[]
  user_defined_objects_in_internal_schemas: string[]
}

const handleGet = (req: NextApiRequest, res: NextApiResponse)=> {
  const response: Response = {
    current_app_version: '',
    current_app_version_release_channel: 'internal',
    duration_estimate_hours: 0,
    eligible: false,
    latest_app_version: '',
    legacy_auth_custom_roles: [],
    objects_to_be_dropped: [],
    target_upgrade_versions: [],
    unsupported_extensions: [],
    user_defined_objects_in_internal_schemas: [],
  }
  return res.status(200).json(response)
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
