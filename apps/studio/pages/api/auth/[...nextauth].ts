import { getKeycloakManager } from 'common/keycloak'

const keycloakManager = getKeycloakManager()
const nextAuthHandler = keycloakManager.asNextAuthHandler()
export default nextAuthHandler
