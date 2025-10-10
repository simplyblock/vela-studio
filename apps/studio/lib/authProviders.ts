import { Provider } from '../components/interfaces/Auth/AuthProvidersForm/AuthProvidersForm.types'
import type { components } from 'api-types'

type AuthProviderField = Provider['properties'][0]
type AuthProvider = components['schemas']['AuthProviderResponse']

const knownAuthorizationUrls: { name: string; hostname: string; icon: string }[] = [
  {
    name: 'Google',
    hostname: 'accounts.google.com',
    icon: 'google-icon',
  },
  {
    name: 'Github',
    hostname: 'github.com',
    icon: 'github-icon',
  },
  {
    name: 'Gitlab',
    hostname: 'gitlab.com',
    icon: 'gitlab-icon',
  },
  {
    name: 'Microsoft Identify Platform',
    hostname: 'login.microsoftonline.com',
    icon: 'microsoft-icon',
  },
  {
    name: 'LinkedIn',
    hostname: 'www.linkedin.com',
    icon: 'linkedin-icon',
  },
]

export const changeableAuthProviderFields = [
  'alias',
  'clientId',
  'issuer',
  'authorizationUrl',
  'tokenUrl',
  'userInfoUrl',
]

export const authProviderFieldProperties: Record<string, AuthProviderField> = {
  alias: {
    title: 'Auth Provider Name',
    description: 'The name of the auth provider configuration',
    type: 'string',
    enum: [],
    show: {
      key: 'displayName',
    },
  },
  clientId: {
    title: 'Client ID',
    description: 'The client ID of the auth provider',
    type: 'string',
    enum: [],
    show: {
      key: 'clientId',
    },
  },
  issuer: {
    title: 'Issuer',
    description: 'The issuer of the auth provider',
    type: 'string',
    enum: [],
    show: {
      key: 'issuer',
    },
  },
  authorizationUrl: {
    title: 'Authorization URL',
    description: 'The authorization URL of the auth provider',
    type: 'string',
    enum: [],
    show: {
      key: 'authorizationUrl',
    },
  },
  tokenUrl: {
    title: 'Token URL',
    description: 'The token URL of the auth provider',
    type: 'string',
    enum: [],
    show: {
      key: 'tokenUrl',
    },
  },
  userInfoUrl: {
    title: 'User Info URL',
    description: 'The user info URL of the auth provider',
    type: 'string',
    enum: [],
    show: {
      key: 'userInfoUrl',
    },
  },
}

export function authProviderIcon(provider: AuthProvider): string | undefined {
  const knownAuthProvider = knownAuthorizationUrls.find(
    (config) => provider?.config?.authorizationUrl.indexOf(config.hostname) !== -1
  )
  return knownAuthProvider?.icon
}
