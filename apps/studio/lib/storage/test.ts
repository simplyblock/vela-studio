import {
  compactDecrypt,
  CompactEncrypt,
  CompactSign,
  compactVerify,
  importPKCS8,
  importSPKI,
} from 'jose'
import crypto from 'node:crypto'

const ES_ALG = 'ES256' as const // JWS signature
const ENC_ALG = 'ECDH-ES' as const // JWE key agreement (direct)
const ENC_ENC = 'A256GCM' as const // JWE content encryption

const test = async () => {
  const loadAsynchronousKeys = async (
    pemPrivateKey: string,
    algorithm: string
  ): Promise<{
    privateKey: CryptoKey
    publicKey: CryptoKey
  }> => {
    const privateKey = await importPKCS8(pemPrivateKey, algorithm)
    const publicKey = await importSPKI(
      crypto
        .createPublicKey({ key: pemPrivateKey, format: 'pem' })
        .export({ format: 'pem', type: 'spki' })
        .toString(),
      algorithm
    )
    return {
      privateKey,
      publicKey,
    }
  }

  const signatureKeys = await loadAsynchronousKeys(
    '-----BEGIN PRIVATE KEY-----\n' +
      'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg+wCqx660bzkiVORC\n' +
      'h4wdZl1C+YKSJLiALcNaAcf1+k6hRANCAATV73c5s5B9TMLgGizxsxZXSF1aVS+0\n' +
      'ItE9+rprR0MaXbrah0ROgyF1UsfCPh/KumkoeApRnK22/rTmNA2Wpz/h\n' +
      '-----END PRIVATE KEY-----\n',
    ES_ALG
  )
  const encryptionKeys = await loadAsynchronousKeys(
    '-----BEGIN PRIVATE KEY-----\n' +
      'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgCUtSGVOPVXJc/pl5\n' +
      '86Tgq23G6aCST4OSbgSSz51EfJGhRANCAASYCceaqw5cOA2nb50EegIN2OO+fzCI\n' +
      '2OtgKVf2w84b+hFrXzYhD1ZRFFMvw2HgQbs+tZCUWdxg9K5AZuFAuQ7f\n' +
      '-----END PRIVATE KEY-----\n',
    ENC_ALG
  )

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
    return `https://test/platform/storage/objects/${hash}?token=${jwe}`
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

  const result = await createSignedUrl(
    'organization_id',
    'project_id',
    'branch_id',
    'https://test',
    'bucket_name',
    'path/to/file.txt',
    '2026-01-01T00:00:00.000Z'
  )
  console.log(result)

  const url = new URL(result)
  const token = url.searchParams.get('token')
  if (!token) throw new Error('No token found in URL')
  const hash = url.pathname.split('/').pop()
  if (!hash) throw new Error('No hash found in URL')
  console.log(hash, token)

  const decoded = await verifySignedUrl(hash, token)
  console.log(decoded)
}

test()
