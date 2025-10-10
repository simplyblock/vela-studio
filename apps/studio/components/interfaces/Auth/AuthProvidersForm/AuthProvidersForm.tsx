import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import type { Provider } from './AuthProvidersForm.types'
import { ProviderForm } from './ProviderForm'
import { useAuthProvidersQuery } from 'data/auth/auth-providers-query'
import type { components } from 'api-types'

type AuthProvider = components['schemas']['AuthProviderResponse']

export const AuthProvidersForm = () => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()

  const {
    data: authProviders,
    error: authProvidersError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthProvidersQuery({ orgId, projectId, branchId })

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex justify-between items-center mb-4">
        <ScaffoldSectionTitle>Auth Providers</ScaffoldSectionTitle>
        <Button
          type="primary"
          htmlType="submit"
        >
          Add Auth Provider
        </Button>
      </div>

      <div className="-space-y-px">
        <ResourceList>
          {isLoading || isSuccess && (
            <AuthProvider authProviders={authProviders} isLoading={isLoading} />
          )}
          {isError && (
            <Alert_Shadcn_ variant="destructive">
              <WarningIcon />
              <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>{authProvidersError?.message}</AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </ResourceList>
      </div>
    </ScaffoldSection>
  )
}

const AuthProvider = ({
  authProviders,
  isLoading,
}: {
  authProviders: AuthProvider[]
  isLoading: boolean
}) => {
  if (isLoading) {
    return [1, 2, 3].map(() => (
      <div className="py-4 px-6 border-b last:border-b-none">
        <HorizontalShimmerWithIcon />
      </div>
    ))
  }

  return authProviders.map((provider) => {
    return (
      <ProviderForm config={provider} provider={provider as unknown as Provider} />
    )
  })
}
