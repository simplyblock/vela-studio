import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from '../api/platformQueryParams'
import { isDocker } from '../docker'
import { getBranchOrRefresh } from '../api/branchCaching'
import crypto from 'node:crypto'
import {
  compactDecrypt,
  CompactEncrypt,
  CompactSign,
  compactVerify,
  importPKCS8,
  importSPKI,
} from 'jose'

const isInDocker = isDocker()

const ES_ALG = 'ES256' as const // JWS signature
const ENC_ALG = 'ECDH-ES' as const // JWE key agreement (direct)
const ENC_ENC = 'A256GCM' as const // JWE content encryption
const publicBaseUrl = process.env.VELA_PLATFORM_EXT_API_SERVICE_URL
if (!publicBaseUrl) throw new Error('VELA_PLATFORM_EXT_API_SERVICE_URL is not set')

const DEFAULT_SEARCH_OPTIONS = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: 'name',
    order: 'asc',
  },
}

const loadAsynchronousKeys = async (
  pemPrivateKey: string
): Promise<{
  privateKey: CryptoKey
  publicKey: CryptoKey
}> => {
  const privateKey = await importPKCS8(pemPrivateKey, ES_ALG)
  const publicKey = await importSPKI(
    crypto
      .createPublicKey({ key: pemPrivateKey, format: 'pem' })
      .export({ format: 'pem', type: 'spki' })
      .toString(),
    ES_ALG
  )
  return {
    privateKey,
    publicKey,
  }
}

const storageSignaturePrivateKey = process.env.STORAGE_SIGNATURE_PRIVATE_KEY
if (!storageSignaturePrivateKey) throw new Error('STORAGE_SIGNATURE_PRIVATE_KEY is not set')

const storageSignaturePublicKey = process.env.STORAGE_SIGNATURE_PUBLIC_KEY
if (!storageSignaturePublicKey) throw new Error('STORAGE_SIGNATURE_PUBLIC_KEY is not set')

const signatureKeys = await loadAsynchronousKeys(storageSignaturePrivateKey)
const encryptionKeys = await loadAsynchronousKeys(storageSignaturePublicKey)

type SignedUrlPayload = {
  organizationId: string
  projectId: string
  branchId: string
  storageObjectUrl: string
  expiresAt: string
}

const signJws = async (payload: SignedUrlPayload) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  return await new CompactSign(data)
    .setProtectedHeader({ alg: ES_ALG, typ: 'JWS' })
    .sign(signatureKeys.privateKey)
}

const verifyJws = async (jws: string) => {
  const decoder = new TextDecoder()
  const { payload } = await compactVerify(jws, signatureKeys.publicKey)
  return JSON.parse(decoder.decode(payload))
}

const encryptJwe = async (content: string) => {
  const encoder = new TextEncoder()
  return await new CompactEncrypt(encoder.encode(content))
    .setProtectedHeader({ alg: ENC_ALG, enc: ENC_ENC })
    .encrypt(encryptionKeys.publicKey)
}

const decryptJwe = async (jwe: string) => {
  const decoder = new TextDecoder()
  const { plaintext } = await compactDecrypt(jwe, encryptionKeys.privateKey)
  return decoder.decode(plaintext)
}

const createSignedUrl = async (
  organizationId: string,
  projectId: string,
  branchId: string,
  storageEndpoint: string,
  bucket: string,
  path: string,
  expiresAt: string
) => {
  const storageObjectUrl = `${storageEndpoint}/object/${bucket}/${path}`
  const hash = crypto.createHash('sha256').update(storageObjectUrl).digest('hex')
  const payload = { storageObjectUrl, organizationId, projectId, branchId, expiresAt }
  const jws = await signJws(payload)
  const jwe = await encryptJwe(jws)
  return `${publicBaseUrl}/platform/storage/objects/${hash}?token=${jwe}`
}

const verifySignedUrl = async (hash: string, jwe: string) => {
  const jws = await decryptJwe(jwe)
  const payload = (await verifyJws(jws)) as SignedUrlPayload
  const testHash = crypto.createHash('sha256').update(payload.storageObjectUrl).digest('hex')
  if (hash !== testHash) throw new Error('Invalid signed URL')

  const expiredAt = Date.parse(payload.expiresAt)
  if (expiredAt < Date.now()) throw new Error('Signed URL has expired')

  return payload
}

export async function newStorageClient(req: NextApiRequest, res: NextApiResponse) {
  const getStorageParameters = async (slug: string, ref: string, branch: string) => {
    const branchEntity = await getBranchOrRefresh(slug, ref, branch, req, res)
    if (!branchEntity) return
    const token = !isInDocker
      ? branchEntity.api_keys.service_role!
      : process.env.SUPABASE_SERVICE_KEY!
    const storageEndpoint = !isInDocker
      ? `${branchEntity.database.service_endpoint_uri}/storage`
      : 'http://storage:5000'
    return {
      token,
      storageEndpoint,
    }
  }

  return {
    getBuckets: async () => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(`${params.storageEndpoint}/bucket`, {
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
      })

      if (response.status === 404) {
        return res.status(200).json([])
      }
      if (response.status !== 200) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    createBucket: async (name: string, isPublic: boolean) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(`${params.storageEndpoint}/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          public: isPublic,
        }),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    deleteBucket: async (name: string) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(`${params.storageEndpoint}/bucket/${name}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    updateBucket: async (name: string, isPublic: boolean) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(`${params.storageEndpoint}/bucket/${name}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${params.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public: isPublic,
        }),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    emptyBucket: async (name: string) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(`${params.storageEndpoint}/bucket/${name}/empty`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    listObjects: async (name: string) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const { path, options } = req.body
      const body = { ...DEFAULT_SEARCH_OPTIONS, ...options, prefix: path || '' }
      const response = await fetch(`${params.storageEndpoint}/object/list/${name}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    deleteObject: async (name: string, paths: string[]) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(`${params.storageEndpoint}/object/${name}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${params.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: paths }),
      })
      if (response.status < 200 || response.status > 299) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res.status(200).json(await response.json())
    },

    createSignedObjectUrl: async (bucket: string, path: string, expiredIn: number) => {
      const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
      const params = await getStorageParameters(slug, ref, branch)
      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const expiresAt = new Date(Date.now() + expiredIn * 1000).toISOString()
      const signedUrl = await createSignedUrl(
        slug,
        ref,
        branch,
        params.storageEndpoint,
        bucket,
        path,
        expiresAt
      )

      return res.status(200).json({ data: signedUrl })
    },

    retrieveSignedObjectUrl: async (hash: string, token: string) => {
      const payload = await verifySignedUrl(hash, token)

      const params = await getStorageParameters(
        payload.organizationId,
        payload.projectId,
        payload.branchId
      )

      if (!params) return res.status(401).json({ error: 'Unauthorized' })

      const response = await fetch(payload.storageObjectUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 404) {
        return res.status(200).json([])
      }
      if (response.status !== 200) {
        return res.status(response.status).json({ error: response.statusText })
      }
      return res
        .status(200)
        .setHeaders(response.headers)
        .send(await response.arrayBuffer())
    },
  }
}
