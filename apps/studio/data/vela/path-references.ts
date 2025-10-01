import { getOrganizationSlug } from './organization-path-slug'
import { getProjectRef } from './project-path-ref'
import { getBranchRef } from './branch-path-ref'

export function getPathReferences(): { slug?: string, ref?: string, branch?: string} {
  return {
    slug: getOrganizationSlug(),
    ref: getProjectRef(),
    branch: getBranchRef()
  }
}