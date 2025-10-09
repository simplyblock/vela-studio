import { useParams } from 'common'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

export const QueuesOverviewTab = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: branch } = useSelectedBranchQuery()

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    branch,
  })

  return (
    <IntegrationOverviewTab
      actions={
        !isExposed ? (
          <Admonition
            type="default"
            title="Queues can be managed via any Supabase client library or PostgREST endpoints"
          >
            <p>
              You may choose to toggle the exposure of Queues through Data APIs via the queues
              settings
            </p>
            <Button asChild type="default">
              <Link href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/integrations/queues/settings`}>
                Manage queues settings
              </Link>
            </Button>
          </Admonition>
        ) : null
      }
    />
  )
}
