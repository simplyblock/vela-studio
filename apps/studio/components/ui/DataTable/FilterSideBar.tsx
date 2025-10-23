import { useRouter } from 'next/router'

import { useParams } from 'common'
import { cn, ResizablePanel } from 'ui'
import { DateRangeDisabled } from './DataTable.types'
import { DataTableFilterControls } from './DataTableFilters/DataTableFilterControls'
import { DataTableResetButton } from './DataTableResetButton'
import { useDataTable } from './providers/DataTableProvider'

interface FilterSideBarProps {
  dateRangeDisabled?: DateRangeDisabled
}

export function FilterSideBar({ dateRangeDisabled }: FilterSideBarProps) {
  const router = useRouter()
  const { slug, ref, branch: branchRef } = useParams()
  const { table } = useDataTable()

  return (
    <ResizablePanel
      order={1}
      maxSize={33}
      defaultSize={1}
      id="panel-left"
      className={cn(
        'flex flex-col w-full',
        'min-w-64 max-w-[32rem]',
        'group-data-[expanded=false]/controls:hidden',
        'hidden sm:flex'
      )}
    >
      <div className="border-b border-border px-4 md:top-0">
        <div className="flex h-[48px] items-center justify-between gap-3">
          <p className="text-foreground text-lg">Logs</p>
          {table.getState().columnFilters.length ? <DataTableResetButton /> : null}
        </div>
      </div>

      <div className="flex-1 p-2 sm:overflow-y-scroll">
        <DataTableFilterControls dateRangeDisabled={dateRangeDisabled} />
      </div>
    </ResizablePanel>
  )
}
