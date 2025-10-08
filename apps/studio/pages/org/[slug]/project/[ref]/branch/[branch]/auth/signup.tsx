import { AuthProvidersForm, BasicAuthSettingsForm } from 'components/interfaces/Auth'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const SignupPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <BasicAuthSettingsForm />
    </ScaffoldContainer>
  )
}

SignupPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default SignupPage
