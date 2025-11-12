import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { Sidebar } from 'components/interfaces/Sidebar'
import { useCheckLatestDeploy } from 'hooks/use-check-latest-deploy'
import { SidebarProvider } from 'ui'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'
import { OrganizationContextProvider } from './OrganizationContext'
import { getOrganizationSlug } from 'data/vela/organization-path-slug'
import { getProjectRef } from 'data/vela/project-path-ref'
import { RbacSubSideBar } from 'components/interfaces/RbacSidebar'
import { VERSION_BUILD_HASH, VERSION_BUILD_TIME } from '../../lib/constants'
import { useVelaControllerVersionQuery } from '../../data/vela/vela-controller-version'

export interface DefaultLayoutProps {
  headerTitle?: string
}

/**
 * Base layout for all project pages in the dashboard, rendered as the first child on all page files within a project.
 *
 * A second layout as the child to this is required, and the layout depends on which section of the dashboard the page is on. (e.g Auth - AuthLayout)
 *
 * The base layout handles rendering the following UI components:
 * - App banner (e.g for notices or incidents)
 * - Mobile navigation bar
 * - First level side navigation bar (e.g For navigating to Table Editor, SQL Editor, Database page, etc)
 */
const DefaultLayout = ({ children, headerTitle }: PropsWithChildren<DefaultLayoutProps>) => {
  const [isInitialized, setInitialized] = useState<boolean>(false)
  const [versionVisible, setVersionVisible] = useState(false)

  const { data: controllerVersion } = useVelaControllerVersionQuery()
  const versionOrUnknown = (version: string | undefined) => {
    if (!version || version.length === 0) {
      return 'unknown'
    }
    return version
  }

  useEffect(() => {
    setInitialized(true)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+V
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        setVersionVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const slug = getOrganizationSlug()
  const ref = getProjectRef()
  const router = useRouter()
  const showProductMenu = !!ref && router.pathname !== '/org/[slug]/project/[ref]'

  const isRbacPath = router.pathname.includes('/rbac')

  useCheckLatestDeploy()

  if (!isInitialized) {
    return <></>
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <OrganizationContextProvider organizationSlug={slug}>
        <ProjectContextProvider projectRef={ref}>
          <AppBannerContextProvider>
            <div className="flex flex-col h-screen w-screen">
              {versionVisible && (
                <div className="flex-grow w-full max-h-6 h-6 text-center bg-purple-500 text-sm">
                  <span>
                    Vela -Studio: {versionOrUnknown(VERSION_BUILD_HASH)} (
                    {versionOrUnknown(VERSION_BUILD_TIME)}) // Vela -Controller:{' '}
                    {versionOrUnknown(controllerVersion?.commit_hash)} (
                    {versionOrUnknown(controllerVersion?.timestamp)})
                  </span>
                </div>
              )}
              {/* Top Banner */}
              <AppBannerWrapper />
              <div className="flex-shrink-0">
                <MobileNavigationBar />
                <LayoutHeader showProductMenu={showProductMenu} headerTitle={headerTitle} />
              </div>
              {/* Main Content Area */}
              <div className="flex flex-1 w-full overflow-y-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Conditionally render Team SubSideBar */}
                {isRbacPath && <RbacSubSideBar />}
                {/* Main Content */}
                <div className="flex-grow h-full overflow-y-auto">{children}</div>
              </div>
            </div>
          </AppBannerContextProvider>
        </ProjectContextProvider>
      </OrganizationContextProvider>
    </SidebarProvider>
  )
}

export default DefaultLayout
