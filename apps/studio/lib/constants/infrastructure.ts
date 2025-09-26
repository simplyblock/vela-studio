import type { components } from 'data/api'

export const PROJECT_STATUS: {
  [key: string]: components['schemas']['ProjectDetailResponse']['status']
} = {
  INACTIVE: 'INACTIVE',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  ACTIVE_UNHEALTHY: 'ACTIVE_UNHEALTHY',
  COMING_UP: 'COMING_UP',
  UNKNOWN: 'UNKNOWN',
  GOING_DOWN: 'GOING_DOWN',
  INIT_FAILED: 'INIT_FAILED',
  REMOVED: 'REMOVED',
  RESTARTING: 'RESTARTING',
  RESTORING: 'RESTORING',
  RESTORE_FAILED: 'RESTORE_FAILED',
  UPGRADING: 'UPGRADING',
  PAUSING: 'PAUSING',
  PAUSE_FAILED: 'PAUSE_FAILED',
  RESIZING: 'RESIZING',
}

export const DEFAULT_MINIMUM_PASSWORD_STRENGTH = 4

export const PASSWORD_STRENGTH = {
  0: 'This password is not acceptable.',
  1: 'This password is not secure enough.',
  2: 'This password is not secure enough.',
  3: 'Not bad, but your password must be harder to guess.',
  4: 'This password is strong.',
}

export const PASSWORD_STRENGTH_COLOR = {
  0: 'bg-red-900',
  1: 'bg-red-900',
  2: 'bg-yellow-900',
  3: 'bg-yellow-900',
  4: 'bg-green-900',
}

export const PASSWORD_STRENGTH_PERCENTAGE = {
  0: '10%',
  1: '30%',
  2: '50%',
  3: '80%',
  4: '100%',
}
