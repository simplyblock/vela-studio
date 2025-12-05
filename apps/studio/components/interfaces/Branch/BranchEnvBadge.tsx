import React from 'react'
import { cn } from 'ui'



export type BranchEnvBadgeProps = {
  env: string | null
  /**
   * 'sm' is compact (smaller padding & text),
   * 'md' is default.
   */
  size?: 'sm' | 'md'
  className?: string
  title?: string // optional tooltip text
}

/**
 * Small badge showing environment type with color mapping for known envs.
 */
export default function BranchEnvBadge({
  env,
  size = 'md',
  className,
  title,
}: BranchEnvBadgeProps) {

  // Normalize env to be case-insensitive and support common aliases
  const key = (env ?? '').toString().trim().toLowerCase()

  const colorMap: Record<string, string> = {
    production: 'bg-red-500 text-black', // light red for production
    prod: 'bg-red-500 text-black',
    staging: 'bg-amber-500 text-black',
    test: 'bg-violet-500 text-white',
    testing: 'bg-violet-500 text-white',
    qa: 'bg-violet-500 text-white',
    development: 'bg-sky-500 text-white',
    dev: 'bg-sky-500 text-white',
    default: 'bg-surface-300 text-foreground',
  }

  const colorClass = colorMap[key] ?? colorMap['default']



  const sizeClass =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 rounded-sm'
      : 'text-[12px] px-2.5 py-0.5 rounded-md'



  return (
    <span
      role="status"
      aria-label={"environment label"}
      className={cn(
        'inline-flex items-center font-medium leading-none',
        sizeClass,
        colorClass,
        className
      )}
    >
      {key}
    </span>
  )
}
