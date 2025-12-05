import { AlertCircle, Check, ChevronDown, Copy, GitBranch, ListTree, Plus, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import BranchEnvBadge from 'components/interfaces/Branch/BranchEnvBadge'
import { Branch } from 'data/branches/branch-query'

const BranchLink = ({
  branch,
  isSelected,
  setOpen,
}: {
  branch: Branch
  isSelected: boolean
  setOpen: (value: boolean) => void
}) => {
  const router = useRouter()
  const href = `/org/${branch.organization_id}/project/${branch.project_id}/branch/${branch.id}`

  return (
    <Link href={href}>
      <CommandItem_Shadcn_
        value={branch.name.replaceAll('"', '')}
        className="cursor-pointer w-full flex items-center justify-between"
        onSelect={() => {
          setOpen(false)
        }}
        onClick={() => {
          setOpen(false)
        }}
      >
        <p className="truncate w-60 flex items-center gap-1" title={branch.name}>
          {branch.name === 'main' && <Shield size={14} className="text-amber-900" />}
          {branch.name}
        </p>
        {isSelected && <Check size={14} strokeWidth={1.5} />}
      </CommandItem_Shadcn_>
    </Link>
  )
}

export const BranchDropdown = () => {
  const router = useRouter()
  const { slug: orgRef, ref, branch: branchRef } = useParams()
  const snap = useAppStateSnapshot()
  const { data: projectDetails } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)

  const {
    data: branches,
    isLoading,
    isError,
    isSuccess,
  } = useBranchesQuery({ orgRef, projectRef: ref }, { enabled: Boolean(projectDetails) })

  const selectedBranch = branches?.find((branch) => branch.id === branchRef)

  const mainBranch = branches?.find((branch) => branch.name === 'main')
  const restOfBranches = branches
    ?.filter((branch) => branch.name !== 'main')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const sortedBranches = (
    branches && branches.length > 0
      ? [mainBranch].concat(restOfBranches ?? [])
      : restOfBranches ?? []
  ).filter((branch) => !!branch)
  const branchList = sortedBranches ?? []

  return (
    <>
      {isLoading && <ShimmeringLoader className="w-[90px]" />}

      {isError && (
        <div className="flex items-center space-x-2 text-amber-900">
          <AlertCircle size={16} strokeWidth={2} />
          <p className="text-sm">Failed to load branches</p>
        </div>
      )}

      {isSuccess && (
        <>
          <Link
            href={`/org/${orgRef}/project/${ref}/branch/${branchRef}`}
            className="flex items-center gap-2 flex-shrink-0 text-sm"
          >
            <GitBranch size={16} strokeWidth={1.5} className="text-foreground-light" />
            <span className="text-foreground max-w-32 lg:max-w-none truncate">
              {selectedBranch?.name ?? 'main'}
            </span>
            <BranchEnvBadge env={selectedBranch?.env_type ?? null} size="sm" className="rounded-full border-0" />
          </Link>
          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                type="text"
                size="tiny"
                className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
                iconRight={<ChevronDown strokeWidth={1.5} />}
              />
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
              <Command_Shadcn_>
                {<CommandInput_Shadcn_ placeholder="Find branch..." />}
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>

                  <CommandGroup_Shadcn_>
                    <ScrollArea className="max-h-[210px] overflow-y-auto">
                      {branchList.map((branch) => (
                        <BranchLink
                          key={branch.id}
                          branch={branch}
                          isSelected={branch.id === selectedBranch?.id || branches?.length === 0}
                          setOpen={setOpen}
                        />
                      ))}
                    </ScrollArea>
                  </CommandGroup_Shadcn_>

                  <CommandSeparator_Shadcn_ />

                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        setOpen(false)
                      }}
                      onClick={() => {
                        setOpen(false)
                      }}
                    >
                      <Link
                        href={`/new/${orgRef}/${ref}`}
                        className="w-full flex items-center gap-2"
                      >
                        <Plus size={14} strokeWidth={1.5} />
                        <p>Create branch</p>
                      </Link>
                    </CommandItem_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        setOpen(false)
                      }}
                      onClick={() => {
                        setOpen(false)
                      }}
                    >
                      <Link
                        href={`/new/${orgRef}/${ref}/${branchRef}?name=Clone%20of%20${selectedBranch?.name}`}
                        className="w-full flex items-center gap-2"
                      >
                        <Copy size={14} strokeWidth={1.5} />
                        <p>Clone current branch</p>
                      </Link>
                    </CommandItem_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        setOpen(false)
                      }}
                      onClick={() => setOpen(false)}
                    >
                      <Link
                        href={`/org/${orgRef}/project/${ref}`}
                        className="w-full flex items-center gap-2"
                      >
                        <ListTree size={14} strokeWidth={1.5} />
                        <p>Manage branches</p>
                      </Link>
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>

                  <CommandSeparator_Shadcn_ />
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </>
      )}
    </>
  )
}
