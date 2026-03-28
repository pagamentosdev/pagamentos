import {
  type HttpBody,
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  HttpClientResponse
} from '@effect/platform'
import type { ParseResult } from 'effect'
import { Effect, Predicate, Redacted, type Schema } from 'effect'

export type OperationRuntimeConfig = {
  apiKey: string | Redacted.Redacted<string>
  baseUrl: string
}

type DefineOperationError = new (payload: {
  message: string
  status?: number
  cause?: unknown
}) => unknown

type DefineOperationPayload = {
  body?: Schema.Schema.Any
  query?: Schema.Schema.Any
  params?: Schema.Schema.Any
}

type DefineOperationConfig = {
  url: string
  method: 'get' | 'post' | 'put' | 'delete'
  input?: DefineOperationPayload
  output?: DefineOperationPayload
  error?: DefineOperationError
  successStatus?: readonly number[]
}

type InferSchemaType<SchemaValue> = SchemaValue extends Schema.Schema.Any
  ? Schema.Schema.Type<SchemaValue>
  : never

type InferOperationPayload<Payload> = ('body' extends keyof Payload
  ? Payload extends {
      body?: infer Body
    }
    ? {
        body: InferSchemaType<NonNullable<Body>>
      }
    : Record<never, never>
  : Record<never, never>) &
  ('query' extends keyof Payload
    ? Payload extends {
        query?: infer Query
      }
      ? {
          query: InferSchemaType<NonNullable<Query>>
        }
      : Record<never, never>
    : Record<never, never>) &
  ('params' extends keyof Payload
    ? Payload extends {
        params?: infer Params
      }
      ? {
          params: InferSchemaType<NonNullable<Params>>
        }
      : Record<never, never>
    : Record<never, never>)

type InferOperationOutput<Output> = 'body' extends keyof Output
  ? Output extends {
      body?: infer Body
    }
    ? InferSchemaType<NonNullable<Body>>
    : InferOperationPayload<Output>
  : InferOperationPayload<Output>

type InferOperationArgs<Config extends DefineOperationConfig> =
  Config['input'] extends DefineOperationPayload
    ? keyof InferOperationPayload<Config['input']> extends never
      ? []
      : [input: InferOperationPayload<Config['input']>]
    : []

type InferOperationInput<Config extends DefineOperationConfig> =
  Config['input'] extends DefineOperationPayload
    ? InferOperationPayload<Config['input']>
    : never

type InferOperationResult<Config extends DefineOperationConfig> =
  Config['output'] extends DefineOperationPayload
    ? InferOperationOutput<Config['output']>
    : undefined

type InferOperationError<Config extends DefineOperationConfig> =
  Config['error'] extends DefineOperationError
    ? InstanceType<Config['error']>
    : never

export type InferOperation<Config extends DefineOperationConfig> = (
  ...args: InferOperationArgs<Config>
) => Effect.Effect<
  InferOperationResult<Config>,
  | InferOperationError<Config>
  | HttpClientError.HttpClientError
  | ParseResult.ParseError
  | HttpBody.HttpBodyError
>

export function defineOperation<const Config extends DefineOperationConfig>(
  config: Config
) {
  return {
    ...config,
    operation: (runtimeConfig: OperationRuntimeConfig) => {
      type Input = InferOperationInput<Config>
      type Result = InferOperationResult<Config>

      const execute = (...args: InferOperationArgs<Config>) =>
        Effect.gen(function* () {
          const client = yield* HttpClient.HttpClient

          const input = args[0] as Input | undefined
          const request = yield* buildRequest(config, runtimeConfig, input)
          const response = yield* client.execute(request)

          const statuses = config.successStatus ?? [200]
          if (!statuses.includes(response.status)) {
            return yield* Effect.fail(
              yield* buildProviderError(config, response)
            )
          }

          return (yield* decodeResponse(config, response)) as Result
        })

      return execute as unknown as InferOperation<Config>
    },
    $inferOperation: null as unknown as InferOperation<Config>
  }
}

const buildRequest = (
  config: DefineOperationConfig,
  runtimeConfig: OperationRuntimeConfig,
  input: unknown
) => {
  const apiKey = Predicate.isString(runtimeConfig.apiKey)
    ? runtimeConfig.apiKey
    : Redacted.value(runtimeConfig.apiKey)

  let request = methodRequest(config.method, config.url).pipe(
    HttpClientRequest.prependUrl(runtimeConfig.baseUrl),
    HttpClientRequest.setHeader('Authorization', `Bearer ${apiKey}`),
    HttpClientRequest.setHeader('Content-Type', 'application/json')
  )

  if (isRecord(input)) {
    if (isRecord(input.params)) {
      request = applyPathParams(request, input.params)
    }

    if (isRecord(input.query)) {
      for (const [key, value] of Object.entries(input.query)) {
        request = HttpClientRequest.setUrlParam(request, key, String(value))
      }
    }

    if ('body' in input) {
      return HttpClientRequest.bodyJson(request, input.body)
    }
  }

  return Effect.succeed(request)
}

const decodeResponse = (
  config: DefineOperationConfig,
  response: HttpClientResponse.HttpClientResponse
) => {
  if (config.output?.body !== undefined) {
    return HttpClientResponse.schemaBodyJson(
      config.output.body as Schema.Schema.Any
    )(response)
  }

  return Effect.succeed(undefined)
}

const buildProviderError = (
  config: DefineOperationConfig,
  response: HttpClientResponse.HttpClientResponse
) => {
  const fallbackMessage = `HTTP ${response.status} for ${response.request.method} ${response.request.url}`

  if (config.error === undefined) {
    return Effect.succeed(new Error(fallbackMessage))
  }

  const errorCtor = config.error

  return Effect.orElse(
    Effect.map(response.json, (payload) => {
      const message = extractErrorMessage(payload) ?? fallbackMessage
      return new errorCtor({
        message,
        status: response.status,
        cause: payload
      })
    }),
    () =>
      Effect.succeed(
        new errorCtor({
          message: fallbackMessage,
          status: response.status,
          cause: response
        })
      )
  )
}

const extractErrorMessage = (payload: unknown): string | undefined => {
  if (typeof payload === 'string') {
    return payload
  }

  if (!isRecord(payload)) {
    return undefined
  }

  if (typeof payload.error === 'string') {
    return payload.error
  }

  if (typeof payload.message === 'string') {
    return payload.message
  }

  return undefined
}

const methodRequest = (
  method: DefineOperationConfig['method'],
  url: string
) => {
  switch (method) {
    case 'get':
      return HttpClientRequest.get(url)
    case 'post':
      return HttpClientRequest.post(url)
    case 'put':
      return HttpClientRequest.put(url)
    case 'delete':
      return HttpClientRequest.del(url)
    default:
      return HttpClientRequest.get(url)
  }
}

const applyPathParams = (
  request: HttpClientRequest.HttpClientRequest,
  params: Record<string, unknown>
) => {
  let url = request.url

  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(String(value)))
  }

  return HttpClientRequest.setUrl(request, url)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
