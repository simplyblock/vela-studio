// Sidebar.tsx

import { AnimatePresence, motion, MotionProps } from 'framer-motion'
import { isUndefined } from 'lodash'
import {
  Activity,
  Blocks,
  Boxes,
  CalendarClock,
  ChartArea,
  HardDrive,
  PanelLeftDashed,
  Settings,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ComponentProps,
  ComponentPropsWithoutRef,
  FC,
  ReactNode,
  useEffect,
} from 'react'
import {
  LOCAL_STORAGE_KEYS,
  useIsMFAEnabled,
  useParams,
} from 'common'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateProjectRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { useHideSidebar } from 'hooks/misc/useHideSidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLints } from 'hooks/misc/useLints'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Home } from 'icons'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  SidebarContent as SidebarContentPrimitive,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  useSidebar,
} from 'ui'

export const ICON_SIZE = 32
export const ICON_STROKE_WIDTH = 1.5
export type SidebarBehaviourType = 'expandable' | 'open' | 'closed'
export const DEFAULT_SIDEBAR_BEHAVIOR = 'expandable'

const SidebarMotion = motion(SidebarPrimitive) as FC<
  ComponentProps<typeof SidebarPrimitive> & {
    transition?: MotionProps['transition']
  }
>

export interface SidebarProps
  extends ComponentPropsWithoutRef<typeof SidebarPrimitive> {}

export const Sidebar = ({ className, ...props }: SidebarProps) => {
  const { setOpen } = useSidebar()
  const hideSideBar = useHideSidebar()

  const [sidebarBehaviour, setSidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  useEffect(() => {
    // logic to toggle sidebar open based on sidebarBehaviour state
    if (sidebarBehaviour === 'open') setOpen(true)
    if (sidebarBehaviour === 'closed') setOpen(false)
  }, [sidebarBehaviour, setOpen])

  return (
    <AnimatePresence>
      {!hideSideBar && (
        <SidebarMotion
          {...props}
          transition={{ delay: 0.4, duration: 0.4 }}
          overflowing={sidebarBehaviour === 'expandable'}
          collapsible="icon"
          variant="sidebar"
          onMouseEnter={() => {
            if (sidebarBehaviour === 'expandable') setOpen(true)
          }}
          onMouseLeave={() => {
            if (sidebarBehaviour === 'expandable') setOpen(false)
          }}
        >
          <SidebarContent
            footer={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="text"
                    className={`w-min px-1.5 mx-0.5 ${
                      sidebarBehaviour === 'open' ? '!px-2' : ''
                    }`}
                    icon={
                      <PanelLeftDashed
                        size={ICON_SIZE}
                        strokeWidth={ICON_STROKE_WIDTH}
                      />
                    }
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-40"
                >
                  <DropdownMenuRadioGroup
                    value={sidebarBehaviour}
                    onValueChange={(value) =>
                      setSidebarBehaviour(value as SidebarBehaviourType)
                    }
                  >
                    <DropdownMenuLabel>Sidebar control</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioItem value="open">
                      Expanded
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="closed">
                      Collapsed
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="expandable">
                      Expand on hover
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </SidebarMotion>
      )}
    </AnimatePresence>
  )
}

/* -------------------------------------------------
   SidebarContent decides WHICH LEVEL to show:
   - Org sidebar (no projectRef)
   - Project sidebar (projectRef && !branchRef)
   - Branch sidebar (projectRef && branchRef)
-------------------------------------------------- */

export const SidebarContent = ({ footer }: { footer?: ReactNode }) => {
  const { ref: projectRef, branch: branchRef } = useParams()

  const which =
    !projectRef ? 'org' : projectRef && !branchRef ? 'project' : 'branch'

  return (
    <>
      <AnimatePresence mode="wait">
        <SidebarContentPrimitive>
          {which === 'org' && (
            <motion.div
              key="org-links"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <OrganizationLinks />
            </motion.div>
          )}

          {which === 'project' && (
            <motion.div
              key="project-links"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ProjectSidebarLinks />
            </motion.div>
          )}

          {which === 'branch' && (
            <motion.div key="branch-links">
              <BranchSidebarLinks />
            </motion.div>
          )}
        </SidebarContentPrimitive>
      </AnimatePresence>

      <SidebarFooter>
        <SidebarGroup className="p-0">{footer}</SidebarGroup>
      </SidebarFooter>
    </>
  )
}

/* -------------------------------------------------
   Shared Nav Button
-------------------------------------------------- */

export function SideBarNavLink({
  route,
  active,
  onClick,
  disabled,
  ...props
}: {
  route: any
  active?: boolean
  disabled?: boolean
  onClick?: () => void
} & ComponentPropsWithoutRef<typeof SidebarMenuButton>) {
  const [sidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  const buttonProps = {
    disabled,
    tooltip: sidebarBehaviour === 'closed' ? route.label : '',
    isActive: active,
    className: cn('text-sm', sidebarBehaviour === 'open' ? '!px-2' : ''),
    size: 'default' as const,
    onClick: onClick,
  }

  const content = props.children ? (
    props.children
  ) : (
    <>
      {route.icon}
      <span>{route.label}</span>
    </>
  )

  return (
    <SidebarMenuItem>
      {route.link && !disabled ? (
        <SidebarMenuButton {...buttonProps} asChild>
          <Link href={route.link}>{content}</Link>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton {...buttonProps}>{content}</SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

/* -------------------------------------------------
   Status dot helper for Advisors menu item
-------------------------------------------------- */

const ActiveDot = (errorArray: any[], warningArray: any[]) => {
  return (
    <div
      className={cn(
        'absolute pointer-events-none flex h-2 w-2 left-[18px] group-data-[state=expanded]:left-[20px] top-2 z-10 rounded-full',
        errorArray.length > 0
          ? 'bg-destructive-600'
          : warningArray.length > 0
            ? 'bg-warning-600'
            : 'bg-transparent'
      )}
    />
  )
}

/* -------------------------------------------------
   PROJECT SIDEBAR (NEW LEVEL)
   /org/:orgRef/project/:projectRef/*
   No branchRef here.
-------------------------------------------------- */

export const ProjectSidebarLinks = () => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef } = useParams() as {
    slug: string
    ref?: string
  }

  const projectRoutes = generateProjectRoutes(orgRef, projectRef)

  // For project-level pages, the path looks like:
  // /org/[orgRef]/project/[projectRef]/[section?]
  const pathParts = router.pathname.split('/')
  const activeRoute = pathParts[5] // may be undefined on /project/:projectRef root

  return (
    <SidebarMenu>
      <SidebarGroup className="gap-0.5">
        {projectRoutes.map((route, i) => (
          <SideBarNavLink
            key={`project-routes-${i}`}
            route={route}
            active={
              (!activeRoute && route.key === 'project-overview') ||
              activeRoute === route.key ||
              router.asPath.includes(route.key)
            }
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}

/* -------------------------------------------------
   BRANCH SIDEBAR (OLD ProjectLinks)
   /org/:orgRef/project/:projectRef/branch/:branchRef/*
   This is what used to be "ProjectLinks", now
   correctly scoped as branch-level.
-------------------------------------------------- */

const BranchSidebarLinks = () => {
  const router = useRouter()
  const {
    slug: orgRef,
    ref: projectRef,
    branch: branchRef,
  } = useParams() as { slug: string; ref?: string; branch?: string }

  const { data: project } = useSelectedProjectQuery()
  const { securityLints, errorLints } = useLints()

  // branch-level pages look like:
  // /org/[orgRef]/project/[projectRef]/branch/[branchRef]/[section]/...
  // split('/') => ['', 'org', orgRef, 'project', projectRef, 'branch', branchRef, <section>, ...]
  // so section = index 7
  const pathParts = router.pathname.split('/')
  const activeRoute = pathParts[7]

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'project_storage:all',
    'realtime:all',
  ])

  // Build groups
  const toolRoutes = generateToolRoutes(orgRef, projectRef, project, branchRef)
  const productRoutes = generateProductRoutes(
    orgRef,
    projectRef,
    project,
    branchRef,
    {
      auth: authEnabled,
      edgeFunctions: edgeFunctionsEnabled,
      storage: storageEnabled,
      realtime: realtimeEnabled,
    }
  )

  // Static branch-specific links (minus Resource Limits,
  // which moved to project scope)
  const branchLinks = [
    {
      key: 'database-backup-schedules',
      label: 'Backup Schedules',
      icon: (
        <CalendarClock size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
      ),
      link:
        projectRef &&
        `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/scheduled`,
      isActive: router.asPath.includes('/database/backups/scheduled'),
    },
    {
      key: 'database-backups',
      label: 'Backups',
      icon: <HardDrive size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/pitr`,
      isActive:
        router.asPath.includes('/database/backups/pitr') ||
        router.asPath.includes(
          '/database/backups/restore-to-new-project'
        ),
    },
  ]

  const otherRoutes = generateOtherRoutes(
    orgRef,
    projectRef,
    project,
    branchRef,
    {
      unifiedLogs: true,
    }
  )
  const settingsRoutes = generateSettingsRoutes(
    orgRef,
    projectRef,
    project,
    branchRef
  )

  return (
    <SidebarMenu>
      {/* "Branch overview" (was Project overview) */}
      <SidebarGroup className="gap-0.5">
        <SideBarNavLink
          key="branch-overview"
          active={
            isUndefined(activeRoute) && !isUndefined(router.query.ref)
          }
          route={{
            key: 'branch-overview',
            label: 'Branch overview',
            icon: (
              <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
            ),
            link:
              projectRef &&
              `/org/${orgRef}/project/${projectRef}/branch/${branchRef}`,
            linkElement: (
              <ProjectIndexPageLink
                slug={orgRef}
                projectRef={projectRef}
                branchRef={branchRef}
              />
            ),
          }}
        />

        {toolRoutes.map((route, i) => (
          <SideBarNavLink
            key={`tools-routes-${i}`}
            route={route}
            active={activeRoute === route.key}
          />
        ))}
      </SidebarGroup>

      <Separator className="w-[calc(100%-1rem)] mx-auto" />

      <SidebarGroup className="gap-0.5">
        {productRoutes.map((route, i) => (
          <SideBarNavLink
            key={`product-routes-${i}`}
            route={route}
            active={activeRoute === route.key}
          />
        ))}

        {branchLinks.map(({ isActive, ...route }) => (
          <SideBarNavLink
            key={route.key}
            route={route}
            active={isActive}
          />
        ))}
      </SidebarGroup>

      <Separator className="w-[calc(100%-1rem)] mx-auto" />

      <SidebarGroup className="gap-0.5">
        {otherRoutes.map((route, i) => {
          if (route.key === 'advisors') {
            return (
              <div className="relative" key={route.key}>
                {ActiveDot(errorLints, securityLints)}
                <SideBarNavLink
                  key={`other-routes-${i}`}
                  route={route}
                  active={activeRoute === route.key}
                />
              </div>
            )
          } else {
            return (
              <SideBarNavLink
                key={`other-routes-${i}`}
                route={route}
                active={activeRoute === route.key}
              />
            )
          }
        })}
      </SidebarGroup>

      {/* Branch settings (was Project Settings) */}
      <SidebarGroup className="gap-0.5">
        {settingsRoutes.map((route, i) => (
          <SideBarNavLink
            key={`settings-routes-${i}`}
            route={route}
            active={activeRoute === route.key}
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}

/* -------------------------------------------------
   ORG SIDEBAR (unchanged)
-------------------------------------------------- */

const OrganizationLinks = () => {
  const router = useRouter()
  const { slug } = useParams()

  const { data: org } = useSelectedOrganizationQuery()
  const isUserMFAEnabled = useIsMFAEnabled()
  const disableAccessMfa =
    org?.organization_requires_mfa && !isUserMFAEnabled

  // Get the full current path
  const currentPath = router.asPath

  const ProjectSection = [
    {
      label: 'Projects',
      href: `/org/${slug}`,
      key: 'projects',
      icon: <Boxes size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'RBAC',
      href: `/org/${slug}/rbac`,
      key: 'rbac',
      icon: <Shield size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
  ]

  const navMenuItems = [
    {
      label: 'Integrations',
      href: `/org/${slug}/integrations`,
      key: 'integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Metering',
      href: `/org/${slug}/metering`,
      key: 'usage',
      icon: <ChartArea size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Backups',
      href: `/org/${slug}/backups`,
      key: 'backups',
      icon: <HardDrive size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
    {
      label: 'Organization settings',
      href: `/org/${slug}/general`,
      key: 'settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    },
  ]

  // Check if a path is active based on URL inclusion
  const isActive = (key: string, href: string) => {
    // Special case for projects which is the root
    if (key === 'projects') {
      return (
        currentPath === `/org/${slug}` ||
        currentPath === `/org/${slug}/` ||
        currentPath.endsWith(`/org/${slug}`) ||
        currentPath.endsWith(`/org/${slug}/`)
      )
    }

    // For settings, check multiple paths
    if (key === 'settings') {
      return (
        currentPath.includes('/general') ||
        currentPath.includes('/apps') ||
        currentPath.includes('/audit') ||
        currentPath.includes('/documents') ||
        currentPath.includes('/security')
      )
    }

    // For all others, check if the current path includes the key
    return currentPath.includes(key)
  }

  return (
    <SidebarMenu className="flex flex-col gap-1 items-start">
      <SidebarGroup className="gap-0.5">
        {ProjectSection.map((item) => (
          <SideBarNavLink
            key={item.key}
            disabled={disableAccessMfa && item.key === 'rbac'}
            active={isActive(item.key, item.href)}
            route={{
              label: item.label,
              link: item.href,
              key: item.key,
              icon: item.icon,
            }}
          />
        ))}
      </SidebarGroup>
      <Separator className="w-[calc(100%-1rem)] mx-auto" />
      <SidebarGroup className="gap-0.5">
        {navMenuItems.map((item) => (
          <SideBarNavLink
            key={item.key}
            disabled={disableAccessMfa}
            active={isActive(item.key, item.href)}
            route={{
              label: item.label,
              link: item.href,
              key: item.key,
              icon: item.icon,
            }}
          />
        ))}
      </SidebarGroup>
    </SidebarMenu>
  )
}
