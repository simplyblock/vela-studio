import { getOrganizationSlug } from './organization-path-slug'
import { getBranchRef, getProjectRef } from './project-path-ref'

export function getPathReferences(): { slug?: string, ref?: string, branch?: string} {
  return {
    slug: getOrganizationSlug(),
    ref: getProjectRef(),
    branch: getBranchRef()
  }
}