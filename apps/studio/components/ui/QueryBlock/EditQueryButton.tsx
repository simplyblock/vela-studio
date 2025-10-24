import { Edit } from 'lucide-react'

import { useParams } from 'common'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipContent,
} from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'

interface EditQueryButtonProps {
  id?: string
  title: string
  sql?: string
  className?: string
  type?: 'default' | 'text'
}

export const EditQueryButton = ({
  id,
  sql,
  title,
  className,
  type = 'text',
}: EditQueryButtonProps) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { newQuery } = useNewQuery()

  const sqlEditorSnap = useSqlEditorV2StateSnapshot()

  const tooltip: { content: ComponentProps<typeof TooltipContent> & { text: string } } = {
    content: { side: 'bottom', text: 'Edit in SQL Editor' },
  }

  if (id !== undefined) {
    return (
      <ButtonTooltip
        asChild
        type={type}
        size="tiny"
        className={cn('w-7 h-7', className)}
        icon={<Edit size={14} strokeWidth={1.5} />}
        tooltip={tooltip}
      >
        <Link href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/sql/${id}`} />
      </ButtonTooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonTooltip
          type={type}
          size="tiny"
          disabled={!sql}
          className={cn('w-7 h-7', className)}
          icon={<Edit size={14} strokeWidth={1.5} />}
          tooltip={!!sql ? tooltip : { content: { side: 'bottom', text: undefined } }}
        />
      </DropdownMenuTrigger>
      {!!sql && (
        <DropdownMenuContent className="w-36">
          <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Addition)}>
            Insert code
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Modification)}
          >
            Replace code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => newQuery(sql, title)}>
            Create new snippet
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
