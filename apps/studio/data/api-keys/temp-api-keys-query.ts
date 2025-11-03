import { handleError, post } from 'data/fetchers'

interface getTemporaryAPIKeyVariables {
  orgRef?: string
  projectRef?: string
  branchRef?: string
  /** In seconds, max: 3600 (an hour) */
  expiry?: number
}

// [Joshen] This one specifically shouldn't need a useQuery hook since the expiry is meant to be short lived
// Used in storage explorer and realtime inspector.
export async function getTemporaryAPIKey(
  { orgRef, projectRef, branchRef, expiry = 300 }: getTemporaryAPIKeyVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/api-keys/temporary',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
        query: {
          authorization_exp: expiry.toString(),
          claims: JSON.stringify({ role: 'service_role' }),
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}
