import { BookHeart, Box, Cpu, Database, Globe } from 'lucide-react'

import { Auth, EdgeFunctions, Storage } from 'icons'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { type LOG_TYPES } from '../UnifiedLogs.constants'
import Logs from 'icons/src/icons/logs'

interface LogTypeIconProps {
  type: (typeof LOG_TYPES)[number]
  size?: number
  strokeWidth?: number
  className?: string
}

export const LogTypeIcon = ({
  type,
  size = 16,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  // [Alaister]: commented out types coming in the future
  const iconMap: Record<(typeof LOG_TYPES)[number], () => React.ReactNode> = {
    // edge: () => <Globe size={size} strokeWidth={strokeWidth} className={className} />,
    postgrest: () => <BookHeart size={size} strokeWidth={strokeWidth} className={className} />,
    auth: () => <Auth size={size} strokeWidth={strokeWidth} className={className} />,
    'edge-function': () => (
      <EdgeFunctions size={size} strokeWidth={strokeWidth} className={className} />
    ),
    postgres: () => <Database size={size} strokeWidth={strokeWidth} className={className} />,
    // function_events: () => (
    //   <EdgeFunctions size={size} strokeWidth={strokeWidth} className={className} />
    // ),
    // supavisor: () => <Cpu size={size} strokeWidth={strokeWidth} className={className} />,
    // postgres_upgrade: () => <Cpu size={size} strokeWidth={strokeWidth} className={className} />,
    storage: () => <Storage size={size} strokeWidth={strokeWidth} className={className} />,
    other: () => <Logs size={size} strokeWidth={strokeWidth} className={className} />,
    // Ebrahim: needed to add those since without them the build would throw an error can replace them with proper icons later on if required 
    pgexporter: () => <Logs size={size} strokeWidth={strokeWidth} className={className} />,
    pgmeta: () => <Logs size={size} strokeWidth={strokeWidth} className={className} />
  }

  const IconComponent =
    iconMap[type] || (() => <Box size={size} strokeWidth={strokeWidth} className={className} />)

  return (
    <Tooltip>
      <TooltipTrigger>
        <IconComponent />
      </TooltipTrigger>
      <TooltipContent side="left">
        <div className="text-xs">{type}</div>
      </TooltipContent>
    </Tooltip>
  )
}

export const LogTypeIconWithText = ({
  type,
  size = 16,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogTypeIcon type={type} size={size} strokeWidth={strokeWidth} />
      <span>{type}</span>
    </div>
  )
}
