import { Data, Effect, Schema } from 'effect'

export class AbacatePayWebhookError extends Data.TaggedError(
  'AbacatePayWebhookError'
)<{
  readonly message: string
  readonly cause?: unknown
}> {}

export const ABACATEPAY_SIGNATURE_HEADER = 'x-webhook-signature'

export const abacatePayWebhookEventSchema = Schema.Literal(
  'checkout.completed',
  'checkout.refunded',
  'checkout.disputed',
  'transparent.completed',
  'transparent.refunded',
  'transparent.disputed',
  'subscription.completed',
  'subscription.cancelled',
  'subscription.renewed',
  'transfer.completed',
  'transfer.failed',
  'payout.completed',
  'payout.failed'
)

export const abacatePayWebhookSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  event: abacatePayWebhookEventSchema,
  apiVersion: Schema.Int,
  devMode: Schema.Boolean,
  data: Schema.Unknown
})

export type AbacatePayWebhookEvent = Schema.Schema.Type<
  typeof abacatePayWebhookEventSchema
>

export type AbacatePayWebhookPayload = Schema.Schema.Type<
  typeof abacatePayWebhookSchema
>

export const decodeWebhookPayload = (payload: unknown) =>
  Schema.decodeUnknown(abacatePayWebhookSchema)(payload).pipe(
    Effect.mapError(
      (cause) =>
        new AbacatePayWebhookError({
          message: 'Invalid AbacatePay webhook payload',
          cause
        })
    )
  )

export const verifyWebhookSecret = (
  secretFromQuery: string,
  expectedSecret: string
) => {
  const received = toUtf8Bytes(secretFromQuery)
  const expected = toUtf8Bytes(expectedSecret)
  return safeEqual(received, expected)
}

export const verifyWebhookSignature = async (
  rawBody: string,
  signatureFromHeader: string,
  publicHmacKey: string
) => {
  const expected = await signWithSha256Base64(rawBody, publicHmacKey)
  const expectedBytes = toUtf8Bytes(expected)
  const receivedBytes = toUtf8Bytes(signatureFromHeader.trim())

  return safeEqual(expectedBytes, receivedBytes)
}

type VerifyAndDecodeWebhookInput = {
  rawBody: string
  signatureFromHeader: string
  publicHmacKey: string
}

export const verifyAndDecodeWebhook = ({
  rawBody,
  signatureFromHeader,
  publicHmacKey
}: VerifyAndDecodeWebhookInput) =>
  Effect.gen(function* () {
    const isValid = yield* Effect.promise(() =>
      verifyWebhookSignature(rawBody, signatureFromHeader, publicHmacKey)
    )

    if (!isValid) {
      return yield* Effect.fail(
        new AbacatePayWebhookError({
          message: 'Invalid AbacatePay webhook signature'
        })
      )
    }

    const json = yield* Effect.try({
      try: () => JSON.parse(rawBody),
      catch: (cause) =>
        new AbacatePayWebhookError({
          message: 'Invalid JSON body for AbacatePay webhook',
          cause
        })
    })

    return yield* decodeWebhookPayload(json)
  })

const signWithSha256Base64 = async (message: string, key: string) => {
  const webCrypto = getCrypto()
  const keyBytes = toUtf8Bytes(key)
  const messageBytes = toUtf8Bytes(message)

  const cryptoKey = await webCrypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  const signature = await webCrypto.subtle.sign('HMAC', cryptoKey, messageBytes)
  return toBase64(new Uint8Array(signature))
}

const getCrypto = () => {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    return globalThis.crypto
  }

  throw new AbacatePayWebhookError({
    message:
      'Web Crypto API is not available in this runtime. Use Node >=18, Bun, Deno, or an Edge runtime with crypto.subtle support.'
  })
}

const toUtf8Bytes = (value: string) => new TextEncoder().encode(value)

const safeEqual = (a: Uint8Array, b: Uint8Array) => {
  let mismatch = a.length !== b.length
  const maxLength = Math.max(a.length, b.length)

  for (let index = 0; index < maxLength; index += 1) {
    const left = index < a.length ? (a[index] ?? 0) : 0
    const right = index < b.length ? (b[index] ?? 0) : 0

    if (left !== right) {
      mismatch = true
    }
  }

  return !mismatch
}

const toBase64 = (bytes: Uint8Array) => {
  if (typeof btoa !== 'undefined') {
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }

    return btoa(binary)
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  throw new AbacatePayWebhookError({
    message: 'No base64 encoder available in this runtime.'
  })
}
