import { ReadReplicaSetupError, ReadReplicaSetupProgress } from '@supabase/shared-types/out/events'

import { components } from 'data/api'
import { PROJECT_STATUS } from 'lib/constants'

export interface Region {
  name: string
  region: string
  coordinates: [number, number]
}

// ReactFlow is scaling everything by the factor of 2
export const NODE_WIDTH = 660
export const NODE_ROW_HEIGHT = 50
export const NODE_SEP = 20

export const REPLICA_STATUS: {
  [key: string]: components['schemas']['DatabaseStatusResponse']['status']
} = {
  //...PROJECT_STATUS, // FIXME replica status needs to be fixed
  INIT_READ_REPLICA: 'INIT_READ_REPLICA',
  INIT_READ_REPLICA_FAILED: 'INIT_READ_REPLICA_FAILED',
}

// [Joshen] Just a more user friendly language, so that all the verbs are progressive
export const INIT_PROGRESS = {
  [ReadReplicaSetupProgress.Requested]: 'Requesting replica instance',
  [ReadReplicaSetupProgress.Started]: 'Launching replica instance',
  [ReadReplicaSetupProgress.LaunchedReadReplicaInstance]: 'Initiating replica setup',
  [ReadReplicaSetupProgress.InitiatedReadReplicaSetup]: 'Downloading base backup',
  [ReadReplicaSetupProgress.DownloadedBaseBackup]: 'Replaying WAL archives',
  [ReadReplicaSetupProgress.ReplayedWalArchives]: 'Completing set up',
  [ReadReplicaSetupProgress.CompletedReadReplicaSetup]: 'Completed',
}

export const ERROR_STATES = {
  [ReadReplicaSetupError.ReadReplicaInstanceLaunchFailed]: 'Failed to launch replica',
  [ReadReplicaSetupError.InitiateReadReplicaSetupFailed]: 'Failed to initiate replica',
  [ReadReplicaSetupError.DownloadBaseBackupFailed]: 'Failed to download backup',
  [ReadReplicaSetupError.ReplayWalArchivesFailed]: 'Failed to replay WAL archives',
  [ReadReplicaSetupError.CompleteReadReplicaSetupFailed]: 'Failed to set up replica',
}
