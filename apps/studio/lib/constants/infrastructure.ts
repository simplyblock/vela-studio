import { components } from 'data/vela/vela-schema'
import { Branch } from '../../data/branches/branch-query'

export function isBranchPaused(branch?: Branch): boolean {
  if (!branch) return false;
  return branch.status === 'PAUSING' || branch.status === 'PAUSED';
}

export function isBranchStopped(branch?: Branch): boolean {
  if (!branch) return false;
  return branch.status === 'STOPPING' || branch.status === 'STOPPED';
}

export function isBranchRunning(branch?: Branch): boolean {
  if (!branch) return false;
  return branch.status === 'ACTIVE_HEALTHY' || branch.status === 'ACTIVE_UNHEALTHY';
}

export const PROJECT_STATUS: {
  [key in components['schemas']['ProjectPublic']['status']]: components['schemas']['ProjectPublic']['status']
} = {
  PAUSING: 'PAUSING',
  PAUSED: 'PAUSED',
  STARTING: 'STARTING',
  STARTED: 'STARTED',
  MIGRATING: 'MIGRATING',
  DELETING: 'DELETING',
  ERROR: 'ERROR',
  UNKNOWN: 'UNKNOWN',
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
