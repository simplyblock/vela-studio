import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getPublicUrlForBucketObject } from 'data/storage/bucket-object-get-public-url-mutation'
import { signBucketObject } from 'data/storage/bucket-object-sign-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { ResponseError } from 'types'
import { StorageItem } from '../Storage.types'

const DEFAULT_EXPIRY = 7 * 24 * 60 * 60 // in seconds, default to 1 week

export const fetchFileUrl = async (
  pathToFile: string,
  orgRef: string,
  projectRef: string,
  branchRef: string,
  bucketId: string,
  isBucketPublic: boolean,
  expiresIn?: number
) => {
  if (isBucketPublic) {
    const data = await getPublicUrlForBucketObject({
      orgRef,
      projectRef,
      branchRef,
      bucketId: bucketId,
      path: pathToFile,
    })
    return data.publicUrl
  } else {
    const data = await signBucketObject({
      orgRef,
      projectRef,
      branchRef,
      bucketId: bucketId,
      path: pathToFile,
      expiresIn: expiresIn ?? DEFAULT_EXPIRY,
    })
    return data.signedUrl
  }
}

type UseFileUrlQueryVariables = {
  file: StorageItem
  orgRef: string
  projectRef: string
  branchRef: string
  bucket: Bucket
}

export const useFetchFileUrlQuery = (
  { file, orgRef, projectRef, branchRef, bucket }: UseFileUrlQueryVariables,
  { ...options }: UseQueryOptions<string, ResponseError> = {}
) => {
  const { getPathAlongOpenedFolders } = useStorageExplorerStateSnapshot()
  const pathToFile = getPathAlongOpenedFolders(false)
  const formattedPathToFile = [pathToFile, file?.name].join('/')

  return useQuery({
    queryKey: [projectRef, 'buckets', bucket.public, bucket.id, 'file', formattedPathToFile],
    queryFn: () =>
      fetchFileUrl(
        formattedPathToFile,
        orgRef,
        projectRef,
        branchRef,
        bucket.id,
        bucket.public,
        DEFAULT_EXPIRY
      ),
    staleTime: DEFAULT_EXPIRY * 1000,
    ...options,
  })
}
