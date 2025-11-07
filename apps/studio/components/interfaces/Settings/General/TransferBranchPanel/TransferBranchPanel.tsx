import { Truck } from 'lucide-react'

import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import TransferBranchButton from './TransferBranchButton'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

const TransferBranchPanel = () => {
  const { data: branch } = useSelectedBranchQuery()

  if (branch === undefined) return null

  return (
    <section id="transfer-branch">
      <FormHeader
        title="Transfer Branch"
        description="Transfer your branch to a different project."
      />
      <Panel>
        <Panel.Content>
          <div className="flex justify-between items-center gap-8">
            <div className="flex space-x-4">
              <Truck className="mt-1" />
              <div className="space-y-1 xl:max-w-lg">
                <p className="text-sm">Transfer branch to another project</p>
                <p className="text-sm text-foreground-light">
                  To transfer branches, the owner must be a member of both the source and target
                  projects.
                </p>
              </div>
            </div>
            <div>
              <TransferBranchButton />
            </div>
          </div>
        </Panel.Content>
      </Panel>
    </section>
  )
}

export default TransferBranchPanel
