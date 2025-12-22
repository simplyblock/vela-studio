import { Activity, Blocks, FileText, Lightbulb, List, SearchCheck, Settings, Shield } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { generateAuthMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import { generateDatabaseMenu } from 'components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
import type { Route } from 'components/ui/ui.types'
import { EditorIndexPageLink } from 'data/prefetchers/project.$ref.editor'
import type { ProjectDetail } from 'data/projects/project-detail-query'
import {
  Auth,
  Database,
  EdgeFunctions,
  Home,
  Realtime,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { PROJECT_STATUS } from 'lib/constants'

/* ----------------------------------------------------------------
   PROJECT-LEVEL ROUTES (NEW)
   /org/:orgRef/project/:projectRef/*
   No branchRef here.
----------------------------------------------------------------- */
export const generateProjectRoutes = (orgRef: string, projectRef?: string): Route[] => {
  return [
    {
      key: 'project-overview',
      label: 'Project Overview',
      icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: projectRef && `/org/${orgRef}/project/${projectRef}`,
      // should we use env:projects:read permission here? 
      // requiredPermission: 'org:projects:read',
    },
    {
      key: 'resource-limits',
      label: 'Resource Limits',
      icon: <Activity size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: projectRef && `/org/${orgRef}/project/${projectRef}/resource-limits`,
      requiredPermission: "project:settings:read",
    },
    {
      key: 'projectRoleAssignment',
      label: 'Role Management',
      icon: <Shield size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: projectRef && `/org/${orgRef}/project/${projectRef}/projectRoleAssignment`,
      requiredPermission: "project:role-assign:read",
    },
    {
      key: 'settings',
      label: 'Project Settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: projectRef && `/org/${orgRef}/project/${projectRef}/settings`,
      requiredPermission: "project:settings:read",
    },
  ]
}

/* ----------------------------------------------------------------
   BRANCH-LEVEL ROUTES (EXISTING)
   /org/:orgRef/project/:projectRef/branch/:branchRef/*
   These feed the "Branch" sidebar.
----------------------------------------------------------------- */

export const generateToolRoutes = (
  orgRef: string,
  projectRef?: string,
  project?: ProjectDetail,
  branchRef?: string
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.STARTING
  const buildingUrl = `/org/${orgRef}/project/${projectRef}/branch/${branchRef}`

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`),
      linkElement: (
        <EditorIndexPageLink orgRef={orgRef} projectRef={projectRef} branchRef={branchRef} />
      ),
    },
    {
      key: 'sql',
      label: 'SQL Editor',
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/sql`),
    },
  ]
}

export const generateProductRoutes = (
  orgRef: string,
  projectRef?: string,
  project?: ProjectDetail,
  branchRef?: string,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    realtime?: boolean
    backups?: boolean
  }
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.STARTED
  const isProjectBuilding = project?.status === PROJECT_STATUS.STARTING
  const buildingUrl = `/org/${orgRef}/project/${projectRef}/branch/${branchRef}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? false
  const realtimeEnabled = features?.realtime ?? true
  const databaseMenu = generateDatabaseMenu(orgRef, project)
  const authMenu = generateAuthMenu(orgRef, projectRef!, branchRef!, {
    showPolicies: features?.auth ?? false,
  })

  return [
    {
      key: 'database',
      label: 'Database',
      icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : isProjectActive
            ? `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/schemas`
            : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/scheduled`),
      items: databaseMenu,
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: 'Authentication',
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              projectRef &&
              (isProjectBuilding
                ? buildingUrl
                : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/users`),
            items: authMenu,
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: 'Storage',
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              projectRef &&
              (isProjectBuilding
                ? buildingUrl
                : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/storage/buckets`),
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Edge Functions',
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              projectRef &&
              (isProjectBuilding
                ? buildingUrl
                : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/functions`),
          },
        ]
      : []),
    // ...(realtimeEnabled
    //   ? [
    //       {
    //         key: 'realtime',
    //         label: 'Realtime',
    //         icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    //         link:
    //           projectRef &&
    //           (isProjectBuilding
    //             ? buildingUrl
    //             : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/realtime/inspector`),
    //       },
    //     ]
    //   : []),
  ]
}

export const generateOtherRoutes = (
  orgRef: string,
  projectRef?: string,
  project?: ProjectDetail,
  branchRef?: string,
  monitoringEndpoint?: string,
  accessToken?: string,
  features?: { unifiedLogs?: boolean }
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.STARTING
  const buildingUrl = `/org/${orgRef}/project/${projectRef}/branch/${branchRef}`

  const unifiedLogsEnabled = features?.unifiedLogs ?? false

  return [
    {
      key: 'advisors',
      label: 'Advisors',
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/security`),
    },
    {
      key: 'logs',
      label: 'Logs',
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : unifiedLogsEnabled
            ? `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/logs`
            : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/logs/explorer`),
    },
    ...(monitoringEndpoint && accessToken && branchRef
      ? [
          {
            key: 'grafana',
            label: 'Monitoring',
            icon: <SearchCheck size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: `${monitoringEndpoint}?auth_token=${accessToken}`,
            target: '_blank',
          },
        ]
      : []),
    {
      key: 'api',
      label: 'API Docs',
      icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api`),
    },
    {
      key: 'integrations',
      label: 'Integrations',
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding
          ? buildingUrl
          : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/integrations`),
    },
  ]
}

export const generateSettingsRoutes = (
  orgRef: string,
  projectRef?: string,
  project?: ProjectDetail,
  branchRef?: string
): Route[] => {
  const settingsMenu = generateSettingsMenu(orgRef, projectRef!, branchRef, project)

  return [
    {
      key: 'branch-settings',
      label: 'Branch Settings', // renamed from "Project Settings"
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        orgRef && projectRef && branchRef && `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general`,
      items: settingsMenu,
    },
  ]
}
