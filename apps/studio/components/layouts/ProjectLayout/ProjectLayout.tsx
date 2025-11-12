import { AnimatePresence, motion } from 'framer-motion'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { forwardRef, Fragment, PropsWithChildren, ReactNode, useEffect } from 'react'

import { useParams } from 'common'
import ProjectAPIDocs from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs'
import { Loading } from 'components/ui/Loading'
import { ResourceExhaustionWarningBanner } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import BuildingState from './BuildingState'
import ConnectingState from './ConnectingState'
import LoadingState from './LoadingState'
import PausingState from './PausingState'
import ProductMenuBar from './ProductMenuBar'
import { ResizingState } from './ResizingState'

// [Joshen] This is temporary while we unblock users from managing their project
// if their project is not responding well for any reason. Eventually needs a bit of an overhaul
const routesToIgnoreProjectDetailsRequest = [
  '/org/[slug]/project/[ref]/branch/[branch]/settings/general',
  '/org/[slug]/project/[ref]/branch/[branch]/database/settings',
  '/org/[slug]/project/[ref]/branch/[branch]/storage/settings',
  '/org/[slug]/project/[ref]/branch/[branch]/settings/infrastructure',
  '/org/[slug]/project/[ref]/branch/[branch]/settings/addons',
]

const routesToIgnoreDBConnection = [
  '/org/[slug]/project/[ref]/branch',
  '/org/[slug]/project/[ref]/branch/[branch]/database/backups/scheduled',
  '/org/[slug]/project/[ref]/branch/[branch]/database/backups/pitr',
  '/org/[slug]/project/[ref]/branch/[branch]/settings/addons',
]

const routesToIgnorePostgrestConnection = [
  '/org/[slug]/project/[ref]/branch/[branch]/reports',
  '/org/[slug]/project/[ref]/branch/[branch]/settings/general',
  '/org/[slug]/project/[ref]/branch/[branch]/database/settings',
  '/org/[slug]/project/[ref]/branch/[branch]/settings/infrastructure',
  '/org/[slug]/project/[ref]/branch/[branch]/settings/addons',
]

export interface ProjectLayoutProps {
  title?: string
  isLoading?: boolean
  isBlocking?: boolean
  product?: string
  productMenu?: ReactNode
  selectedTable?: string
  resizableSidebar?: boolean
  stickySidebarBottom?: boolean
  productMenuClassName?: string
}

const ProjectLayout = forwardRef<HTMLDivElement, PropsWithChildren<ProjectLayoutProps>>(
  (
    {
      title,
      isLoading = false,
      isBlocking = true,
      product = '',
      productMenu,
      children,
      selectedTable,
      resizableSidebar = false,
      stickySidebarBottom = false,
      productMenuClassName,
    },
    ref
  ) => {
    const router = useRouter()
    const { data: selectedOrganization } = useSelectedOrganizationQuery()
    const { data: selectedProject } = useSelectedProjectQuery()

    const { mobileMenuOpen, showSidebar, setMobileMenuOpen } = useAppStateSnapshot()

    const editor = useEditorType()
    const forceShowProductMenu = editor === undefined
    const sideBarIsOpen = forceShowProductMenu || showSidebar

    const projectName = selectedProject?.name
    const organizationName = selectedOrganization?.name

    const isPaused = selectedProject?.status === PROJECT_STATUS.PAUSED
    const showProductMenu = selectedProject
      ? selectedProject.status === PROJECT_STATUS.STARTED ||
        (selectedProject.status === PROJECT_STATUS.STARTING &&
          router.pathname.includes('/org/[slug]/project/[ref]/branch/[branch]/settings')) ||
        router.pathname.includes('/org/[slug]/project/[ref]/branch')
      : true

    const ignorePausedState =
      router.pathname === '/org/[slug]/project/[ref]' ||
      router.pathname.includes('/org/[slug]/project/[ref]/branch/[branch]/settings')
    const showPausedState = isPaused && !ignorePausedState

    return (
      <>
        <Head>
          <title>
            {title
              ? `${title} | Supabase`
              : selectedTable
                ? `${selectedTable} | ${projectName} | ${organizationName} | Supabase`
                : projectName
                  ? `${projectName} | ${organizationName} | Supabase`
                  : organizationName
                    ? `${organizationName} | Supabase`
                    : 'Supabase'}
          </title>
          <meta name="description" content="Vela Studio" />
        </Head>
        <div className="flex flex-row h-full w-full">
          <ResizablePanelGroup direction="horizontal" autoSaveId="project-layout">
            {showProductMenu && productMenu && (
              <ResizablePanel
                order={1}
                maxSize={33}
                defaultSize={1}
                id="panel-left"
                className={cn(
                  'hidden md:block',
                  'transition-all duration-[120ms]',
                  sideBarIsOpen
                    ? resizableSidebar
                      ? 'min-w-64 max-w-[32rem]'
                      : 'min-w-64 max-w-64'
                    : 'w-0 flex-shrink-0 max-w-0'
                )}
              >
                {sideBarIsOpen && (
                  <AnimatePresence initial={false}>
                    <motion.div
                      initial={{ width: 0, opacity: 0, height: '100%' }}
                      animate={{ width: 'auto', opacity: 1, height: '100%' }}
                      exit={{ width: 0, opacity: 0, height: '100%' }}
                      className="h-full"
                      transition={{ duration: 0.12 }}
                    >
                      <MenuBarWrapper
                        isLoading={isLoading}
                        isBlocking={isBlocking}
                        productMenu={productMenu}
                      >
                        <ProductMenuBar title={product} className={productMenuClassName}>
                          {productMenu}
                        </ProductMenuBar>
                      </MenuBarWrapper>
                    </motion.div>
                  </AnimatePresence>
                )}
              </ResizablePanel>
            )}
            {showProductMenu && productMenu && sideBarIsOpen && (
              <ResizableHandle
                withHandle
                disabled={resizableSidebar ? false : true}
                className="hidden md:flex"
              />
            )}
            <ResizablePanel order={2} id="panel-right" className="h-full flex flex-col w-full">
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full overflow-x-hidden flex-1 flex flex-row gap-0"
                autoSaveId="project-layout-content"
              >
                <ResizablePanel
                  id="panel-content"
                  className={cn('w-full xl:min-w-[600px] bg-dash-sidebar')}
                >
                  <main
                    className="h-full flex flex-col flex-1 w-full overflow-y-auto overflow-x-hidden @container"
                    ref={ref}
                  >
                    <ContentWrapper isLoading={isLoading} isBlocking={isBlocking}>
                      <ResourceExhaustionWarningBanner />
                      {children}
                    </ContentWrapper>
                  </main>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <ProjectAPIDocs />
        <MobileSheetNav
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          stickyBottom={stickySidebarBottom}
        >
          {productMenu}
        </MobileSheetNav>
      </>
    )
  }
)

ProjectLayout.displayName = 'ProjectLayout'

export const ProjectLayoutWithAuth = withAuth(ProjectLayout)

export default ProjectLayout

interface MenuBarWrapperProps {
  isLoading: boolean
  isBlocking?: boolean
  productMenu?: ReactNode
  children: ReactNode
}

const MenuBarWrapper = ({
  isLoading,
  isBlocking = true,
  productMenu,
  children,
}: MenuBarWrapperProps) => {
  const router = useRouter()
  const { data: selectedProject } = useSelectedProjectQuery()
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  if (!isBlocking) {
    return children
  }

  const showMenuBar =
    !requiresProjectDetails || (requiresProjectDetails && selectedProject !== undefined)

  return !isLoading && productMenu && showMenuBar ? children : null
}

interface ContentWrapperProps {
  isLoading: boolean
  isBlocking?: boolean
  children: ReactNode
}


const ContentWrapper = ({ isLoading, isBlocking = true, children }: ContentWrapperProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: selectedProject } = useSelectedProjectQuery()

  const isBranchesPage = router.pathname.includes('/org/[slug]/project/[ref]/branch')
  const isSettingsPages = router.pathname.includes(
    '/org/[slug]/project/[ref]/branch/[branch]/settings'
  )
  const isVaultPage = router.pathname === '/org/[slug]/project/[ref]/branch/[branch]/settings/vault'
  const isBackupsPage = router.pathname.includes(
    '/org/[slug]/project/[ref]/branch/[branch]/database/backups'
  )

  const requiresDbConnection: boolean =
    (!isSettingsPages && !routesToIgnoreDBConnection.includes(router.pathname)) || isVaultPage
  const requiresPostgrestConnection = !routesToIgnorePostgrestConnection.includes(router.pathname)
  const requiresProjectDetails = !routesToIgnoreProjectDetailsRequest.includes(router.pathname)

  const isResizing = selectedProject?.status === PROJECT_STATUS.MIGRATING
  const isProjectBuilding =
    selectedProject?.status === PROJECT_STATUS.STARTING ||
    selectedProject?.status === PROJECT_STATUS.UNKNOWN
  const isProjectPausing = selectedProject?.status === PROJECT_STATUS.PAUSING
  const isProjectOffline = selectedProject?.status === 'PAUSED'

  useEffect(() => {
    if (ref) state.setSelectedDatabaseId(ref)
  }, [ref])

  if (isBlocking && (isLoading || (requiresProjectDetails && selectedProject === undefined))) {
    return router.pathname.endsWith('[ref]') ? <LoadingState /> : <Loading />
  }

  if (isResizing && !isBackupsPage) {
    return <ResizingState />
  }

  if (isProjectPausing) {
    return <PausingState project={selectedProject} />
  }

  if (requiresPostgrestConnection && isProjectOffline) {
    return <ConnectingState project={selectedProject} />
  }

  if (requiresDbConnection && isProjectBuilding && !isBranchesPage) {
    return <BuildingState />
  }

  return <Fragment key={selectedProject?.id}>{children}</Fragment>
}
