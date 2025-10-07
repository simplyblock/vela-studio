import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

/**
 * Hook to fetch and filter project lints
 *
 * Retrieves all lints for the current project and filters them by:
 * - Security-related lints
 * - Error-level security lints
 *
 * @returns {Object} Object containing filtered lint arrays
 * @returns {Array} securityLints - All security-related lints
 * @returns {Array} errorLints - Security lints with ERROR level
 */
export const useLints = () => {
  const { data: branch } = useSelectedBranchQuery()
  const { data } = useProjectLintsQuery({
    branch,
  })

  const securityLints = (Array.isArray(data) && data || []).filter((lint) => lint.categories.includes('SECURITY'))
  const errorLints = securityLints.filter((lint) => lint.level === 'ERROR')

  return { securityLints, errorLints }
}
