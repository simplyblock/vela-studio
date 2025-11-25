import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const totp_path = '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/authentication/required-actions/{alias}'
const flow_execution_path = '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/authentication/flows/{flowAlias}/executions'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, "slug", "ref", "branch")
  const client = getVelaClient(req)

  const { success: totp_success, data: totp_data } = await client.getOrFail(res, totp_path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        alias: 'CONFIGURE_TOTP'
      }
    }
  })

  if (!totp_success) return;

  const totp_enabled = totp_data.enabled;

  const { success: flow_execution_success, data: flow_execution_data } = await client.getOrFail(res, flow_execution_path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        flowAlias: 'forms'
      }
    }
  })

  if (!flow_execution_success) return;

  const totp_verification_requirement = flow_execution_data.find((step: any) => step.providerId === 'auth-otp-form')?.requirement;
  if (totp_verification_requirement !== 'ALTERNATIVE' && totp_verification_requirement !== 'DISABLED') return  // invalid state
  const totp_verification_enabled = totp_verification_requirement === 'ALTERNATIVE'

  if (totp_enabled && totp_verification_enabled) {
    return res.json({status: 'enabled'})
  } else if (!totp_enabled && totp_verification_enabled) {
    return res.json({status: 'verify-enabled'})
  } else if (!totp_enabled && !totp_verification_enabled) {
    return res.json({status: 'disabled'})
  } else {
    return  // invalid state
  }
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, "slug", "ref", "branch")
  const client = getVelaClient(req)

  const status = req.body.status
  if (!status) return res.status(422).json({ message: 'Missing MFA status' })
  if ((status !== 'enabled') && (status !== 'verify-enabled') && (status !== 'disabled')) return res.status(422).json({ message: 'Invalid MFA status' })

  const totp_enabled = req.body.status === 'enabled'
  const totp_verification_requirement = (req.body.status !== 'disabled') ? 'ALTERNATIVE' : 'DISABLED'

  const { success: totp_success, data: totp_data } = await client.getOrFail(res, totp_path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        alias: 'CONFIGURE_TOTP'
      }
    }
  })
  if (!totp_success) { return }


  if (totp_data.enabled !== totp_enabled) {
    const { success: totp_update_success } = await client.putOrFail(res, totp_path, {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
          alias: 'CONFIGURE_TOTP',
        },
      },
      body: {
        ...totp_data,
        enabled: totp_enabled,
      },
    })
    if (!totp_update_success) { return }
  }

  const { success: flow_execution_success, data: flow_execution_data } = await client.getOrFail(res, flow_execution_path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        flowAlias: 'forms'
      }
    }
  })

  if (!flow_execution_success) return;

  const flow_execution_step = flow_execution_data?.find((step: any) => step.providerId === 'auth-otp-form')
  if (flow_execution_step?.requirement !== totp_verification_requirement) {
    const { success: totp_verification_update_success } = await client.putOrFail(res, flow_execution_path, {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
          flowAlias: 'forms',
        },
      },
      body: {
        ...flow_execution_step,
        requirement: totp_verification_requirement,
      }
    })
    if (!totp_verification_update_success) { return }
  }

  return res.status(200).json({})
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet).put(handlePut))

export default apiHandler
