import createClient, {
  ClientMethod,
  FetchResponse,
  HeadersOptions,
  InitParam,
  MaybeOptionalInit,
  ParseAsResponse,
  RequestOptions,
} from 'openapi-fetch'
import { paths } from './vela-schema'
import { VELA_PLATFORM_URL } from '../../pages/api/constants'
import { NextApiRequest, NextApiResponse } from 'next'
import {
  HttpMethod,
  MediaType,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers'

type UndefToNever<T> = T extends undefined ? never : T

type Paths<Method extends HttpMethod = HttpMethod> = {
  [K in keyof paths]: {
    [M in Method]-?: UndefToNever<paths[K][M]>
  }
}

type ProxyMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
> = <
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
>(
  res: NextApiResponse,
  url: Path,
  ...init: InitParam<Init>
) => Promise<void>

type ErrorAwareClientMethodResult<
  T extends {},
  Init extends RequestOptions<T> & Omit<RequestInit, 'body' | 'headers'>,
  Media extends MediaType,
> =
  | {
      success: true
      data: ParseAsResponse<SuccessResponse<ResponseObjectMap<T>, Media>, Init>
    }
  | {
      success: false
      data?: never
    }

type ErrorAwareClientMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
> = <
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Media extends MediaType = MediaType,
>(
  res: NextApiResponse,
  url: Path,
  ...init: InitParam<Init>
) => Promise<ErrorAwareClientMethodResult<Paths[Path][Method], NonNullable<Init>, Media>>

export interface Client<Media extends MediaType = MediaType> {
  get: ClientMethod<Paths, 'get', Media>
  put: ClientMethod<Paths, 'put', Media>
  post: ClientMethod<Paths, 'post', Media>
  delete: ClientMethod<Paths, 'delete', Media>
  options: ClientMethod<Paths, 'options', Media>
  head: ClientMethod<Paths, 'head', Media>
  patch: ClientMethod<Paths, 'patch', Media>
  trace: ClientMethod<Paths, 'trace', Media>

  proxyGet: ProxyMethod<Paths, 'get'>
  proxyPut: ProxyMethod<Paths, 'put'>
  proxyPost: ProxyMethod<Paths, 'post'>
  proxyDelete: ProxyMethod<Paths, 'delete'>
  proxyOptions: ProxyMethod<Paths, 'options'>
  proxyHead: ProxyMethod<Paths, 'head'>
  proxyPatch: ProxyMethod<Paths, 'patch'>
  proxyTrace: ProxyMethod<Paths, 'trace'>

  getOrFail: ErrorAwareClientMethod<Paths, 'get'>
  putOrFail: ErrorAwareClientMethod<Paths, 'put'>
  postOrFail: ErrorAwareClientMethod<Paths, 'post'>
  deleteOrFail: ErrorAwareClientMethod<Paths, 'delete'>
  optionsOrFail: ErrorAwareClientMethod<Paths, 'options'>
  headOrFail: ErrorAwareClientMethod<Paths, 'head'>
  patchOrFail: ErrorAwareClientMethod<Paths, 'patch'>
  traceOrFail: ErrorAwareClientMethod<Paths, 'trace'>
}

const velaClient = createClient<Paths>({
  baseUrl: VELA_PLATFORM_URL,
  credentials: 'include',
  redirect: 'follow',
  headers: {
    'Content-Type': 'application/json',
  },
})

const mergeHeaders = (req: NextApiRequest, headers: HeadersOptions[]) => {
  const authorization = req.headers.authorization
  const newHeader = {
    ...headers.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
    ...(authorization ? { Authorization: authorization } : {}),
  }
  return newHeader as HeadersOptions
}

const prepareOptions = (req: NextApiRequest, copyBody: boolean, init: object | object[]) => {
  const origOptions = Array.isArray(init) ? init : [init]
  const origHeaders = origOptions
    .filter((x) => x !== undefined && 'headers' in x)
    .map((x) => x?.headers)
    .filter((x) => x !== undefined)

  const headers = mergeHeaders(req, origHeaders)
  const options = origOptions.reduce((acc, cur) => {
    return {
      ...acc,
      ...cur,
    }
  }, {})

  return {
    body: copyBody && req.body ? req.body : undefined,
    ...options,
    headers: headers,
  } as any
}

export async function proxyWithMapping<
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Media extends MediaType,
  ReturnValue extends {} = Paths[Path][Method],
>(
  req: NextApiRequest,
  res: NextApiResponse,
  method: Method,
  path: Path,
  mapper: (
    value: ParseAsResponse<SuccessResponse<ResponseObjectMap<ReturnValue>, Media>, Init> | undefined
  ) => any,
  ...init: InitParam<Init>
) {
  const getClientMethod = (method: Method): ErrorAwareClientMethod<Paths, Method> => {
    const client = getVelaClient(req)
    switch (method) {
      case 'head':
        return client.headOrFail
      case 'trace':
        return client.traceOrFail
      case 'options':
        return client.optionsOrFail
      case 'patch':
        return client.patchOrFail
      case 'delete':
        return client.deleteOrFail
      case 'put':
        return client.putOrFail
      case 'post':
        return client.postOrFail
    }
    return client.getOrFail
  }

  const clientMethod = getClientMethod(method)
  const { success, data } = await clientMethod(res, path, ...(init as any))

  if (!success) {
    return
  }

  return res.status(200).json(mapper(data as any))
}

export function validStatusCodes(...statusCodes: number[]) {
  return (status: number) => statusCodes.includes(status)
}

export function maybeHandleError(
  res: NextApiResponse,
  response: FetchResponse<any, any, any>,
  validateStatus?: (status: number) => boolean
): boolean {
  if (validateStatus && validateStatus(response.response.status)) {
    return false
  }

  if (response.error) {
    const status = response.response.status
    const data = response.data
    res.status(status).json({ message: data ? data : response.error })
    return true
  }

  if (response.response.status <= 200 && response.response.status >= 299) {
    const status = response.response.status
    res.status(status).json({ message: response.data ?? 'Unknown error' })
    return true
  }
  return false
}

export function getVelaClient(req: NextApiRequest): Client<`${string}/${string}`> {
  return {
    async proxyDelete<
      Path extends PathsWithMethod<Paths, 'delete'>,
      Init extends MaybeOptionalInit<Paths[Path], 'delete'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.DELETE(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyGet<
      Path extends PathsWithMethod<Paths, 'get'>,
      Init extends MaybeOptionalInit<Paths[Path], 'get'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.GET(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyHead<
      Path extends PathsWithMethod<Paths, 'head'>,
      Init extends MaybeOptionalInit<Paths[Path], 'head'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.HEAD(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyOptions<
      Path extends PathsWithMethod<Paths, 'options'>,
      Init extends MaybeOptionalInit<Paths[Path], 'options'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.OPTIONS(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyPatch<
      Path extends PathsWithMethod<Paths, 'patch'>,
      Init extends MaybeOptionalInit<Paths[Path], 'patch'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.PATCH(url, prepareOptions(req, true, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyPost<
      Path extends PathsWithMethod<Paths, 'post'>,
      Init extends MaybeOptionalInit<Paths[Path], 'post'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.POST(url, prepareOptions(req, true, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyPut<
      Path extends PathsWithMethod<Paths, 'put'>,
      Init extends MaybeOptionalInit<Paths[Path], 'put'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.PUT(url, prepareOptions(req, true, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async proxyTrace<
      Path extends PathsWithMethod<Paths, 'trace'>,
      Init extends MaybeOptionalInit<Paths[Path], 'trace'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.TRACE(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return
      return res.status(response.response.status).json(response.data)
    },
    async deleteOrFail<
      Path extends PathsWithMethod<Paths, 'delete'>,
      Init extends MaybeOptionalInit<Paths[Path], 'delete'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.DELETE(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async getOrFail<
      Path extends PathsWithMethod<Paths, 'get'>,
      Init extends MaybeOptionalInit<Paths[Path], 'get'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.GET(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async headOrFail<
      Path extends PathsWithMethod<Paths, 'head'>,
      Init extends MaybeOptionalInit<Paths[Path], 'head'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.HEAD(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async optionsOrFail<
      Path extends PathsWithMethod<Paths, 'options'>,
      Init extends MaybeOptionalInit<Paths[Path], 'options'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.OPTIONS(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async patchOrFail<
      Path extends PathsWithMethod<Paths, 'patch'>,
      Init extends MaybeOptionalInit<Paths[Path], 'patch'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.PATCH(url, prepareOptions(req, true, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async postOrFail<
      Path extends PathsWithMethod<Paths, 'post'>,
      Init extends MaybeOptionalInit<Paths[Path], 'post'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.POST(url, prepareOptions(req, true, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async putOrFail<
      Path extends PathsWithMethod<Paths, 'put'>,
      Init extends MaybeOptionalInit<Paths[Path], 'put'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.PUT(url, prepareOptions(req, true, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    async traceOrFail<
      Path extends PathsWithMethod<Paths, 'trace'>,
      Init extends MaybeOptionalInit<Paths[Path], 'trace'>,
    >(res: NextApiResponse, url: Path, ...init: InitParam<Init>) {
      const response = await velaClient.TRACE(url, prepareOptions(req, false, init))
      if (maybeHandleError(res, response)) return { success: false }
      return { success: true, data: response.data }
    },
    delete<
      Path extends PathsWithMethod<Paths, 'delete'>,
      Init extends MaybeOptionalInit<Paths[Path], 'delete'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['delete'], Init, `${string}/${string}`>> {
      return velaClient.DELETE(url, prepareOptions(req, false, init))
    },
    get<
      Path extends PathsWithMethod<Paths, 'get'>,
      Init extends MaybeOptionalInit<Paths[Path], 'get'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['get'], Init, `${string}/${string}`>> {
      return velaClient.GET(url, prepareOptions(req, false, init))
    },
    head<
      Path extends PathsWithMethod<Paths, 'head'>,
      Init extends MaybeOptionalInit<Paths[Path], 'head'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['head'], Init, `${string}/${string}`>> {
      return velaClient.HEAD(url, prepareOptions(req, false, init))
    },
    options<
      Path extends PathsWithMethod<Paths, 'options'>,
      Init extends MaybeOptionalInit<Paths[Path], 'options'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['options'], Init, `${string}/${string}`>> {
      return velaClient.OPTIONS(url, prepareOptions(req, false, init))
    },
    patch<
      Path extends PathsWithMethod<Paths, 'patch'>,
      Init extends MaybeOptionalInit<Paths[Path], 'patch'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['patch'], Init, `${string}/${string}`>> {
      return velaClient.PATCH(url, prepareOptions(req, false, init))
    },
    post<
      Path extends PathsWithMethod<Paths, 'post'>,
      Init extends MaybeOptionalInit<Paths[Path], 'post'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['post'], Init, `${string}/${string}`>> {
      return velaClient.POST(url, prepareOptions(req, false, init))
    },
    put<
      Path extends PathsWithMethod<Paths, 'put'>,
      Init extends MaybeOptionalInit<Paths[Path], 'put'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['put'], Init, `${string}/${string}`>> {
      return velaClient.PUT(url, prepareOptions(req, false, init))
    },
    trace<
      Path extends PathsWithMethod<Paths, 'trace'>,
      Init extends MaybeOptionalInit<Paths[Path], 'trace'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<Paths[Path]['trace'], Init, `${string}/${string}`>> {
      return velaClient.TRACE(url, prepareOptions(req, false, init))
    },
  }
}
