import { useEffect } from 'react'

import { AuthenticationLayout } from 'components/layouts/AuthenticationLayout'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import type { NextPageWithLayout } from 'types'
import { getSession, signIn } from 'next-auth/react'
import { getReturnToPath } from 'common/keycloak'
import { logOut } from 'common'

const SignInPage: NextPageWithLayout = () => {
  useEffect(() => {
    setTimeout(async ()=> {
      const session = await getSession()
      if (session) {
        try {
          await logOut()
        } catch (err) {
          console.error(err)
        }
        return signIn("keycloak", {
          callbackUrl: getReturnToPath(),
          redirect: true
        })
      }
      return signIn("keycloak", {
        callbackUrl: getReturnToPath(),
        redirect: true
      })
    }, 0)
  }, [])

  return (
    <>
    </>
  )
}

SignInPage.getLayout = (page) => (
  <AuthenticationLayout>
    <SignInLayout
      heading="Welcome"
      subheading="We will send you to the login page"
    >
      {page}
    </SignInLayout>
  </AuthenticationLayout>
)

export default SignInPage
