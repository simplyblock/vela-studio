'use client'

import * as SwitchPrimitives from '@radix-ui/react-switch'
import { VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

const switchRootVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border',
    'transition-colors focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // unchecked
    'data-[state=unchecked]:bg-control data-[state=unchecked]:hover:bg-border',
    // checked – subtle brand tint + border (keep or tweak as you like)
    'data-[state=checked]:bg-brand-200 data-[state=checked]:border-brand-500',
  ].join(' '),
  {
    variants: {
      size: {
        small: 'h-[16px] w-[28px]',
        medium: 'h-[20px] w-[34px]',
        large: 'h-[24px] w-[44px]',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

const switchThumbVariants = cva(
  [
    'pointer-events-none block rounded-full shadow-sm ring-0 transition-transform',
    'bg-foreground-lighter', // base thumb color (off state)
    // Optional: border when checked for more contrast in all themes
    'data-[state=checked]:border data-[state=checked]:border-border-strong',
  ].join(' '),
  {
    variants: {
      size: {
        small:
          'h-[12px] w-[12px] data-[state=checked]:translate-x-[13px] data-[state=unchecked]:translate-x-[1px]',
        medium:
          'h-[16px] w-[16px] data-[state=checked]:translate-x-[15px] data-[state=unchecked]:translate-x-[1px]',
        large:
          'h-[18px] w-[18px] data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[3px]',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchRootVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(switchRootVariants({ size }), className)}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn('switch-thumb', switchThumbVariants({ size }))}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
