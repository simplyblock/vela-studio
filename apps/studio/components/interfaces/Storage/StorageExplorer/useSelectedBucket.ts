import { useParams } from 'common'
import { useBucketsQuery } from 'data/storage/buckets-query'

export const useSelectedBucket = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef, bucketId } = useParams()

  const {
    data: buckets = [],
    isSuccess,
    isError,
    error,
  } = useBucketsQuery({ orgRef, projectRef, branchRef })
  const bucket = buckets.find((b) => b.id === bucketId)

  return { bucket, isSuccess, isError, error }
}
