import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchSchemas } from 'data/database/schemas-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { prefetchEntityTypes } from 'data/entity-types/entity-types-infinite-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'
import { useParams } from 'common'

export function usePrefetchEditorIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { slug: orgRef, branch: branchRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [entityTypesSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  return useCallback(() => {
    if (!project) return

    // Prefetch code
    router.prefetch(`/org/${orgRef}/project/${project.ref}/branch/${branchRef}/editor`)

    // Prefetch data
    prefetchSchemas(queryClient, {
      orgSlug: orgRef,
      projectRef: project.ref,
      connectionString: project.connectionString,
    }).catch(() => {
      // eat prefetching errors as they are not critical
    })
    prefetchEntityTypes(queryClient, {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sort: entityTypesSort,
      filterTypes: Object.values(ENTITY_TYPE),
    }).catch(() => {
      // eat prefetching errors as they are not critical
    })
  }, [entityTypesSort, project, queryClient, router])
}

interface EditorIndexPageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  orgRef: string
  branchRef?: string
  href?: PrefetchableLinkProps['href']
}

export function EditorIndexPageLink({
  href,
  projectRef,
  orgRef,
  branchRef,
  children,
  ...props
}: PropsWithChildren<EditorIndexPageLinkProps>) {
  const prefetch = usePrefetchEditorIndexPage()

  return (
    <PrefetchableLink
      href={href || `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`}
      prefetcher={prefetch}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}
