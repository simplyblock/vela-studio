import { useRouter } from 'next/router'

/**
 * Derives the current product segment and page segment for branch-level product routes.
 * Pattern: /org/:orgRef/project/:projectRef/branch/:branchRef/<product>/<page?>
 * Returns { product, page } where page may be undefined for product root.
 */
export const useBranchProductPage = () => {
  const router = useRouter()
  const segments = router.pathname.split('/')
  const branchIndex = segments.indexOf('branch')
  if (branchIndex === -1) {
    return { product: undefined, page: undefined }
  }
  const product = segments[branchIndex + 2] // skip 'branch' and branchRef
  const page = segments[branchIndex + 3] // may be undefined
  return { product, page }
}

export default useBranchProductPage
