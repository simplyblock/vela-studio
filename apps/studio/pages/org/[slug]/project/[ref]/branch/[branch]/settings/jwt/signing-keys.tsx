import JWTSecretKeysTable from 'components/interfaces/JwtSecrets/jwt-secret-keys-table'
import DefaultLayout from 'components/layouts/DefaultLayout'
import JWTKeysLayout from 'components/layouts/JWTKeys/JWTKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const JWTSigningKeysPage: NextPageWithLayout = () => {
  const { can: canReadAPIKeys, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:api:getkeys")

  return (
    <>
      {!isPermissionsLoaded ? (
        <GenericSkeletonLoader />
      ) : !canReadAPIKeys ? (
        <NoPermission isFullPage resourceText="access your project's API keys" />
      ) : (
        <JWTSecretKeysTable />
      )}
    </>
  )
}

JWTSigningKeysPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <JWTKeysLayout>{page}</JWTKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default JWTSigningKeysPage
