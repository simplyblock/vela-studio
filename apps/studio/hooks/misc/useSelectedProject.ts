import { useIsLoggedIn } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { getPathReferences } from '../../data/vela/path-references'

export function useSelectedProjectQuery({ enabled = true } = {}) {
  const { slug, ref } = getPathReferences()
  return useProjectDetailQuery(
    { slug, ref },
    {
      enabled,
      select: (data) => {
        return { ...data, parentRef: data.parent_project_ref ?? data.ref }
      },
    }
  )
}

export function useProjectByRefQuery(ref?: string) {
  const isLoggedIn = useIsLoggedIn()

  const { slug } = getPathReferences()
  const projectQuery = useProjectDetailQuery({ slug, ref }, { enabled: isLoggedIn })

  // [Alaister]: This is here for the purpose of improving performance.
  // Chances are, the user will already have the list of projects in the cache.
  // We can't exclusively rely on this method, as useProjectsQuery does not return branch projects.
  const projectsQuery = useProjectsQuery({
    enabled: isLoggedIn,
    select: (data) => {
      return data.find((project) => project.ref === ref)
    },
  })

  if (projectQuery.isSuccess) {
    return projectQuery
  }

  return projectsQuery
}
