import { includes, noop, sortBy } from 'lodash'
import { Edit2, FileText, MoreVertical, Trash } from 'lucide-react'
import { useRouter } from 'next/router'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableRow,
  TableCell,
} from 'ui'
import { getPathReferences } from 'data/vela/path-references'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface FunctionListProps {
  schema: string
  filterString: string
  isLocked: boolean
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const FunctionList = ({
  schema,
  filterString,
  isLocked,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionListProps) => {
  const router = useRouter()
  const { slug: orgRef, branch: branchRef } = getPathReferences()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  const { data: functions } = useDatabaseFunctionsQuery({
    branch,
  })

  const filteredFunctions = (functions ?? []).filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _functions = sortBy(
    filteredFunctions.filter((x) => x.schema == schema),
    (func) => func.name.toLocaleLowerCase()
  )
  const projectRef = selectedProject?.id
  const { can: canUpdateFunctions } = useCheckPermissions("branch:edge:admin")

  if (_functions.length === 0 && filterString.length === 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={5}>
          <p className="text-sm text-foreground">No functions created yet</p>
          <p className="text-sm text-foreground-light">
            There are no functions found in the schema "{schema}"
          </p>
        </TableCell>
      </TableRow>
    )
  }

  if (_functions.length === 0 && filterString.length > 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={5}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            Your search for "{filterString}" did not return any results
          </p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {_functions.map((x) => {
        const isApiDocumentAvailable = schema == 'public' && x.return_type !== 'trigger'

        return (
          <TableRow key={x.id}>
            <TableCell className="truncate">
              <Button
                type="text"
                className="text-foreground text-sm p-0 hover:bg-transparent"
                onClick={() => editFunction(x)}
              >
                {x.name}
              </Button>
            </TableCell>
            <TableCell className="table-cell overflow-auto">
              <p title={x.argument_types} className="truncate">
                {x.argument_types || '-'}
              </p>
            </TableCell>
            <TableCell className="table-cell">
              <p title={x.return_type}>{x.return_type}</p>
            </TableCell>
            <TableCell className="table-cell">
              {x.security_definer ? 'Definer' : 'Invoker'}
            </TableCell>
            <TableCell className="text-right">
              {!isLocked && (
                <div className="flex items-center justify-end">
                  {canUpdateFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="More options"
                          type="default"
                          className="px-1"
                          icon={<MoreVertical />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" className="w-52">
                        {isApiDocumentAvailable && (
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => router.push(`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api?rpc=${x.name}`)}
                          >
                            <FileText size={14} />
                            <p>Client API docs</p>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="space-x-2" onClick={() => editFunction(x)}>
                          <Edit2 size={14} />
                          <p>Edit function</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="space-x-2" onClick={() => deleteFunction(x)}>
                          <Trash size={14} className="text-destructive" />
                          <p>Delete function</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <ButtonTooltip
                      disabled
                      type="default"
                      icon={<MoreVertical />}
                      className="px-1"
                      tooltip={{
                        content: {
                          side: 'left',
                          text: 'You need additional permissions to update functions',
                        },
                      }}
                    />
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}

export default FunctionList
