import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Loading } from 'components/ui/Loading'
import { useSignOut } from 'lib/auth'
import { NextPageWithLayout } from 'types'
import { useQueryClient } from '@tanstack/react-query'
import { clearLocalStorage } from 'common'

const LogoutPage: NextPageWithLayout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const logout = async () => {
      // Clear local storage
      clearLocalStorage()
      // Clear Assistant IndexedDB
      queryClient.clear()

      // Successful and send back to sign-in
      toast('Successfully logged out')
      await router.push('/sign-in')
    }
    logout()
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Loading />
    </div>
  )
}

export default LogoutPage
