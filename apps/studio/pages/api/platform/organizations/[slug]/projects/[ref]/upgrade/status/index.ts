import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

interface Response {
  databaseUpgradeStatus: {
    /** @enum {string} */
    error?:
      | '1_upgraded_instance_launch_failed'
      | '2_volume_detachchment_from_upgraded_instance_failed'
      | '3_volume_attachment_to_original_instance_failed'
      | '4_data_upgrade_initiation_failed'
      | '5_data_upgrade_completion_failed'
      | '6_volume_detachchment_from_original_instance_failed'
      | '7_volume_attachment_to_upgraded_instance_failed'
      | '8_upgrade_completion_failed'
      | '9_post_physical_backup_failed'
    initiated_at: string
    latest_status_at: string
    /** @enum {string} */
    progress?:
      | '0_requested'
      | '1_started'
      | '2_launched_upgraded_instance'
      | '3_detached_volume_from_upgraded_instance'
      | '4_attached_volume_to_original_instance'
      | '5_initiated_data_upgrade'
      | '6_completed_data_upgrade'
      | '7_detached_volume_from_original_instance'
      | '8_attached_volume_to_upgraded_instance'
      | '9_completed_upgrade'
      | '10_completed_post_physical_backup'
    status: number
    target_version: number
  } | null
}

const handleGet = (req: NextApiRequest, res: NextApiResponse) => {
  const response: Response = {
    databaseUpgradeStatus: null
  }

  return res.status(200).json(response)
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
