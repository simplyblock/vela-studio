import { Blocks, FileText, Lightbulb, List, Settings } from 'lucide-react'

import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { generateAuthMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import { generateDatabaseMenu } from 'components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
import type { Route } from 'components/ui/ui.types'
import { EditorIndexPageLink } from 'data/prefetchers/project.$ref.editor'
import type { Project } from 'data/projects/project-detail-query'
import {
  Auth,
  Database,
  EdgeFunctions,
  Realtime,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { PROJECT_STATUS } from 'lib/constants'

export const generateToolRoutes = (
  slug: string,
  ref?: string,
  project?: Project,
  branchRef?: string,
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/[slug]/project/${ref}/branch/${branchRef}`

  return [
    {
      key: 'editor',
      label: 'Table Editor',
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding
          ? buildingUrl
          : `/org/${slug}/project/${ref}/branch/${branchRef}/editor`),
      linkElement: <EditorIndexPageLink slug={slug} projectRef={ref} />,
    },
    {
      key: 'sql',
      label: 'SQL Editor',
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding ? buildingUrl : `/org/${slug}/project/${ref}/branch/${branchRef}/sql`),
    },
  ]
}
export const generateProductRoutes = (
  orgRef: string,
  projectRef?: string,
  project?: Project,
  branchRef?: string,
  features?: { auth?: boolean; edgeFunctions?: boolean; storage?: boolean; realtime?: boolean }
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/${orgRef}/project/${projectRef}/branch/${branchRef}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true

  const databaseMenu = generateDatabaseMenu(orgRef, project)
  const authMenu = generateAuthMenu(orgRef, projectRef!)

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
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: 'Realtime',
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              projectRef &&
              (isProjectBuilding
                ? buildingUrl
                : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/realtime/inspector`),
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (
  orgRef: string,
  projectRef?: string,
  project?: Project,
  branchRef?: string,
  features?: { unifiedLogs?: boolean }
): Route[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
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
    // {
    //   key: 'reports',
    //   label: 'Reports',
    //   icon: <Reports size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    //   link: ref && (isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/reports`),
    // },

    // {
    //   key: 'logs',
    //   label: 'Logs',
    //   icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    //   link: ref && (isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/logs`),
    // },
    {
      key: 'api',
      label: 'API Docs',
      icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        projectRef &&
        (isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api`),
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
  project?: Project,
  branchRef?: string
): Route[] => {
  const settingsMenu = generateSettingsMenu(orgRef, projectRef!, project, branchRef)
  return [
    {
      key: 'settings',
      label: 'Project Settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: projectRef && `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general`,
      items: settingsMenu,
    },
  ]
}
