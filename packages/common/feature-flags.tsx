'use client'

import { FlagValues } from 'flags/react'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

import { components } from 'api-types'
import { get, post } from './fetchWrappers'
import { ensurePlatformSuffix } from './helpers'
import { useServiceUrls } from './hooks/useServiceUrls'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBody']
export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponse']

export async function getFeatureFlags(API_URL: string) {
  const data = await get(`${ensurePlatformSuffix(API_URL)}/telemetry/feature-flags`)

  return data as CallFeatureFlagsResponse
}

export async function trackFeatureFlag(API_URL: string, body: TrackFeatureFlagVariables) {
  const consent = true // FIXME: if required, but I doubt it

  if (!consent) return undefined
  await post(`${ensurePlatformSuffix(API_URL)}/telemetry/feature-flags/track`, { body })
}

export type FeatureFlagContextType = {
  configcat: { [key: string]: boolean | number | string | null }
  hasLoaded?: boolean
}

export const FeatureFlagContext = createContext<FeatureFlagContextType>({
  configcat: {},
  hasLoaded: false,
})

function getCookies() {
  const pairs = document.cookie.split(';')
  let cookies: Record<string, string> = {}
  for (var i = 0; i < pairs.length; i++) {
    var [t_key, value] = pairs[i].split('=')
    const key = t_key.trim()

    cookies[key] = unescape(value)
  }
  return cookies
}

export const FeatureFlagProvider = ({
  enabled = true,
  getConfigCatFlags,
  children,
}: PropsWithChildren<{
  enabled?: boolean
  getConfigCatFlags?: (
    userEmail?: string
  ) => Promise<{ settingKey: string; settingValue: boolean | number | string | null | undefined }[]>
}>) => {
  //const user = useUser()

  const {data: serviceUrls, loading } = useServiceUrls()

  const [store, setStore] = useState<FeatureFlagContextType>({
    configcat: {},
    hasLoaded: loading,
  })

  useEffect(() => {
    let mounted = true

    async function processFlags() {
      if (!enabled) return

      let flagStore: FeatureFlagContextType = { configcat: {} }

      if (!loading) return

      // Run both async operations in parallel
      const [flags, flagValues] = await Promise.all([
        getFeatureFlags(serviceUrls.platformApiServiceUrl),
        typeof getConfigCatFlags === 'function'
          ? getConfigCatFlags(''/*user?.email*/)
          : Promise.resolve([]),
      ])

      // Process ConfigCat flags
      if (typeof getConfigCatFlags === 'function') {
        let overridesCookieValue: Record<string, boolean> = {}
        try {
          const cookies = getCookies()
          overridesCookieValue = JSON.parse(cookies['vercel-flag-overrides'])
        } catch {}

        flagValues.forEach((item) => {
          flagStore['configcat'][item.settingKey] =
            overridesCookieValue[item.settingKey] ??
            (item.settingValue === null ? null : item.settingValue ?? false)
        })
      }

      flagStore.hasLoaded = true

      if (mounted) {
        setStore(flagStore)
      }
    }

    // [Joshen] getFlags get triggered everytime the tab refocuses but this should be okay
    // as per https://configcat.com/docs/sdk-reference/js/#polling-modes:
    // The polling downloads the config.json at the set interval and are stored in the internal cache
    // which subsequently all getValueAsync() calls are served from there
    processFlags()

    return () => {
      mounted = false
    }
  }, [enabled, loading /*, user?.email*/])

  return (
    <FeatureFlagContext.Provider value={store}>
      {/*
        [Joshen] Just support configcat flags in Vercel flags for now for simplicity
        although I think it should be fairly simply to support PH too
      */}
      <FlagValues values={store.configcat} />
      {children}
    </FeatureFlagContext.Provider>
  )
}

export const useFeatureFlags = () => {
  return useContext(FeatureFlagContext)
}
