import Link from 'next/link'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { useParams } from 'common'

interface UpgradeDatabaseAlertProps {
  minimumVersion?: string
}

export const UpgradeDatabaseAlert = ({ minimumVersion = '15.6' }: UpgradeDatabaseAlertProps) => {
  const { slug: orgRef, branch: branchRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  return (
    <Admonition
      type="warning"
      className="mt-4"
      title="Database upgrade needed"
      childProps={{ description: { className: 'flex flex-col gap-y-2' } }}
    >
      <div className="prose text-sm max-w-full">
        <p>
          This integration requires the <code>pgmq</code> extension which is not available on this
          version of Postgres. The extension is available on version {minimumVersion} and higher.
        </p>
      </div>
      <Button color="primary" className="w-fit">
        <Link href={`/org/${orgRef}/project/${project?.id}/branch/${branchRef}/settings/infrastructure`}>Upgrade database</Link>
      </Button>
    </Admonition>
  )
}
