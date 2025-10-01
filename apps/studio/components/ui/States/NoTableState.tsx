import { useRouter } from 'next/router'
import ProductEmptyState from '../../to-be-cleaned/ProductEmptyState'

interface Props {
  message: string
}

const NoTableState: React.FC<Props> = ({ message }) => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = router.query

  return (
    <ProductEmptyState
      title="No public tables found"
      ctaButtonLabel="Create a new table"
      onClickCta={() => {
        router.push(`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`)
      }}
    >
      <p className="text-sm text-foreground-light">{message}</p>
    </ProductEmptyState>
  )
}

export default NoTableState
