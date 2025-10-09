import { PropsWithChildren, useEffect, useState } from 'react'

export interface ServiceUrlsResponse {
  platformBaseUrl: string
  platformSignInUrl: string
  platformApiServiceUrl: string
}

export type UseServiceUrlsResponse = {
  loading: boolean,
  data: ServiceUrlsResponse
}

export const ServiceUrlsProvider = ({ children }: PropsWithChildren) => {
  return (
    <>
      {children}
    </>
  )
}

export function useServiceUrls(): UseServiceUrlsResponse {
  const [serviceUrls, setServiceUrls] = useState<ServiceUrlsResponse>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadServiceUrls = async () => {
    const response = await fetch('/api/platform/service-urls')
    if (!response.ok) {
      console.error(await response.text())
    } else {
      const urls = (await response.json()) as ServiceUrlsResponse
      setServiceUrls(urls)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let timeout: number | undefined

    // Wrap for automatic retrying
    const wrapper = () => {
      timeout = undefined
      return loadServiceUrls().catch(() => {
        timeout = window.setTimeout(() => {
          wrapper()
        }, 1000)
      })
    }

    // Start loading
    wrapper()

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  return { data: serviceUrls, loading: isLoading } as UseServiceUrlsResponse
}
