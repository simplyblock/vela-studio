import { HTMLProps, ReactNode, useCallback, useState } from 'react'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { Sheet, SheetContent } from 'ui'
import { CreateWrapperSheet } from './CreateWrapperSheet'
import DeleteWrapperModal from './DeleteWrapperModal'
import { WRAPPERS } from './Wrappers.constants'
import { wrapperMetaComparator } from './Wrappers.utils'
import { WrapperTable } from './WrapperTable'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

export const WrappersTab = () => {
  const { id } = useParams()
  const { data: branch } = useSelectedBranchQuery()
  const [selectedWrapperForDelete, setSelectedWrapperForDelete] = useState<FDW | null>(null)
  const [createWrapperShown, setCreateWrapperShown] = useState(false)
  const [isClosingCreateWrapper, setisClosingCreateWrapper] = useState(false)
  // FIXME: need permission implemented 
  const { can: canCreateWrapper } = {can:true}

  const { data } = useFDWsQuery({
    branch,
  })

  const wrappers = data ?? []
  const wrapperMeta = WRAPPERS.find((w) => w.name === id)

  // this contains a collection of all wrapper instances for the wrapper type
  const createdWrappers = wrapperMeta
    ? wrappers.filter((w) => wrapperMetaComparator(wrapperMeta, w))
    : []

  const Container = useCallback(
    ({ ...props }: { children: ReactNode } & HTMLProps<HTMLDivElement>) => (
      <div className="w-full mx-10 py-10 ">
        {props.children}
        <Sheet open={!!createWrapperShown} onOpenChange={() => setisClosingCreateWrapper(true)}>
          <SheetContent size="lg" tabIndex={undefined}>
            {wrapperMeta && (
              <CreateWrapperSheet
                wrapperMeta={wrapperMeta}
                onClose={() => {
                  setCreateWrapperShown(false)
                  setisClosingCreateWrapper(false)
                }}
                isClosing={isClosingCreateWrapper}
                setIsClosing={setisClosingCreateWrapper}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    ),
    [createWrapperShown, wrapperMeta, isClosingCreateWrapper]
  )

  if (!wrapperMeta) {
    return <div>Missing integration.</div>
  }

  if (createdWrappers.length === 0) {
    return (
      <Container>
        <div className=" w-full h-48 max-w-4xl">
          <div className="border rounded-lg h-full flex flex-col gap-y-2 items-center justify-center">
            <p className="text-sm text-foreground-light">
              No {wrapperMeta.label} wrappers have been installed
            </p>
            <ButtonTooltip
              type="default"
              onClick={() => setCreateWrapperShown(true)}
              disabled={!canCreateWrapper}
              tooltip={{
                content: {
                  text: !canCreateWrapper
                    ? 'You need additional permissions to create a foreign data wrapper'
                    : undefined,
                },
              }}
            >
              Add new wrapper
            </ButtonTooltip>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <WrapperTable />
      {selectedWrapperForDelete && (
        <DeleteWrapperModal
          selectedWrapper={selectedWrapperForDelete}
          onClose={() => setSelectedWrapperForDelete(null)}
        />
      )}
    </Container>
  )
}
