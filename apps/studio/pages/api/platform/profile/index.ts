import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2 } from '../../constants'

interface ProfileResponse {
  disabled_features: (
  | 'organizations:create'
  | 'organizations:delete'
  | 'organization_members:create'
  | 'organization_members:delete'
  | 'projects:create'
  | 'projects:transfer'
  | 'project_auth:all'
  | 'project_storage:all'
  | 'project_edge_function:all'
  | 'profile:update'
  | 'billing:account_data'
  | 'billing:credits'
  | 'billing:invoices'
  | 'billing:payment_methods'
  | 'realtime:all'
  | 'database:replication'
  | 'database:roles'
)[]
  first_name: string
  free_project_limit: number
  user_id: string
  id: number
  is_alpha_user: boolean
  last_name: string
  mobile: string
  primary_email: string
  username: string
  organizations: any[]
}


const handleGet = async (req: NextApiRequest, res: NextApiResponse<ProfileResponse>) => {
  // Platform specific endpoint
  const response: ProfileResponse = {
    id: 1,
    primary_email: 'johndoe@vela.run',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    organizations: [
      {
        id: 1,
        name: 'Default Organization',
        slug: 'default-org-slug',
        projects: [
          { ...DEFAULT_PROJECT },
          { ...DEFAULT_PROJECT_2 },
        ],
      },
    ],
    disabled_features: [
      'database:replication',
    ],
    free_project_limit: 0,
    mobile: '',
    is_alpha_user: true,
    user_id: '1234567890',
  }
  return res.status(200).json(response)
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    primary_email: '',
    username: '',
    first_name: '',
    last_name: '',
    organizations: [],
    ...req.body,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    primary_email: '',
    username: '',
    first_name: '',
    last_name: '',
    organizations: [],
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
})

export default apiHandler
