import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { VELA_PLATFORM_KEYCLOAK_REALM, VELA_PLATFORM_KEYCLOAK_URL } from '../../constants'

interface SignupRequestUi {
  email: string
  password: string
  hcaptchaToken: string
  redirectTo: string
}

interface SignupResponseAuth {
  id: string
  aud: string
  role: string
  email: string
  phone: string
  confirmation_sent_at: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  user_metadata: {
    email: string
    email_verified: boolean
    phone_verified: boolean
    sub: string
  }
  identities: {
    identity_id: string
    id: string
    user_id: string
    identity_data: {
      email: string
      email_verified: boolean
      phone_verified: boolean
      sub: string
    }
    provider: string
    last_sign_in_at: string
    created_at: string
    updated_at: string
    email: string
  }[]
  created_at: string
  updated_at: string
  is_anonymous: boolean
}

interface KeycloakSignupRequest {
  username: string
  email: string
  firstName?: string
  lastName?: string
  enabled: boolean
  emailVerified: boolean
  credentials: [
    {
      type: 'password'
      value: string
      temporary: false
    },
  ]
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const request = req.body as SignupRequestUi
  const signupRequest: KeycloakSignupRequest = {
    username: request.email,
    email: request.email,
    emailVerified: true,
    enabled: true,
    credentials: [{
      type: 'password',
      value: request.password,
      temporary: false,
    }],
  }

  const url = `${VELA_PLATFORM_KEYCLOAK_URL}/admin/realms/${VELA_PLATFORM_KEYCLOAK_REALM}/users`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signupRequest),
  })

  if (response.status !== 200) {
    if (response.status === 409) {
      return res.status(409).json({
        error: {
          message: 'User already exists',
        },
      })
    } else if (response.status === 400) {
      return res.status(400).json({
        error: {
          message: 'Invalid request',
        },
      })
    }
    return res.status(response.status).send(response.body)
  }

  const data = await response.json()
  console.log(JSON.stringify(data, null, 2))
  return res.status(200).json(data)
}

const apiHandler = apiBuilder((builder) => builder.post(handlePost))

export default apiHandler
