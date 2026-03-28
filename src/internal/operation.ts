import type { Effect, Schema } from 'effect'

export function defineOperation<const Config extends DefineOperationConfig>(
  config: Config
) {
  return config as Config & {
    readonly $inferOperation: InferOperation<Config>
  }
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
) => Effect.Effect<InferOperationResult<Config>, InferOperationError<Config>>

type DefineOperationError = abstract new (...args: never[]) => unknown

type DefineOperationPayload = {
  body?: Schema.Any
  query?: Schema.Any
  params?: Schema.Any
}

type DefineOperationConfig = {
  url: string
  method: 'get' | 'post' | 'put' | 'delete'
  input?: DefineOperationPayload
  output?: DefineOperationPayload
  error?: DefineOperationError
}
