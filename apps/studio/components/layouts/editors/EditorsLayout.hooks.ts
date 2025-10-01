import { useParams } from 'common'
import { usePathname } from 'next/navigation'

export function useEditorType(): 'table' | 'sql' | undefined {
  const pathname = usePathname()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  return pathname?.includes(`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`)
    ? 'table'
    : pathname?.includes(`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/sql`)
      ? 'sql'
      : undefined
}
