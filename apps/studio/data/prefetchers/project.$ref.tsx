import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchProjectDetail } from 'data/projects/project-detail-query'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'

export function usePrefetchProjectIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useCallback(
    ({ slug, projectRef }: { slug: string, projectRef?: string }) => {
      // Prefetch code
      router.prefetch(`/org/${slug}/project/${projectRef}`)

      // Prefetch data
      prefetchProjectDetail(queryClient, {
        slug,
        ref: projectRef,
      }).catch(() => {
        // eat prefetching errors as they are not critical
      })
    },
    [queryClient, router]
  )
}

interface ProjectIndexPageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  slug: string
  branchRef?: string
  href?: PrefetchableLinkProps['href']
}

export function ProjectIndexPageLink({
  href,
  projectRef,
  slug,
  branchRef,
  children,
  ...props
}: PropsWithChildren<ProjectIndexPageLinkProps>) {
  const prefetch = usePrefetchProjectIndexPage()

  return (
    <PrefetchableLink
      href={href || `/org/${slug}/project/${projectRef}/branch/${branchRef}`}
      prefetcher={() => prefetch({ slug, projectRef })}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}
