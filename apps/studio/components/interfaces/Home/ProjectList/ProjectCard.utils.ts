import type { ProjectInfo } from 'data/projects/projects-query'
import { PROJECT_STATUS } from 'lib/constants'

export const inferProjectStatus = (project: ProjectInfo) => {
  let status = undefined
  switch (project.status) {
    case PROJECT_STATUS.STARTED:
      status = 'isStarted'
      break
    case PROJECT_STATUS.PAUSING:
      status = 'isPausing'
      break
    case PROJECT_STATUS.PAUSED:
      status = 'isPaused'
      break
    case PROJECT_STATUS.DELETING:
      status = 'isDeleting'
      break
    case PROJECT_STATUS.MIGRATING:
      status = 'isMigrating'
      break
    case PROJECT_STATUS.ERROR:
      status = 'isError'
      break
    case PROJECT_STATUS.UNKNOWN:
    case PROJECT_STATUS.STARTING:
      status = 'isComingUp'
      break
  }
  return status as InferredProjectStatus
}

export type InferredProjectStatus =
  | 'isHealthy'
  | 'isPausing'
  | 'isPaused'
  | 'isPauseFailed'
  | 'isRestarting'
  | 'isResizing'
  | 'isRestoring'
  | 'isRestoreFailed'
  | 'isComingUp'
  | 'isUpgrading'
  | undefined
