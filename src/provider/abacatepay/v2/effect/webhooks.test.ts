import { describe, expect, it } from '@effect/vitest'
import { Effect } from 'effect'
import {
  ABACATEPAY_SIGNATURE_HEADER,
  decodeWebhookPayload,
  verifyAndDecodeWebhook,
  verifyWebhookSecret,
  verifyWebhookSignature
} from './webhooks'

const publicHmacKey = 'test_public_hmac_key'
const replaceLastCharRegex = /.$/

const validPayload = {
  id: 'evt_123',
  event: 'checkout.completed',
  apiVersion: 2,
  devMode: true,
  data: {
    checkoutId: 'bill_123'
  }
} as const

const validPayloadBody = JSON.stringify(validPayload)

const signPayload = (body: string, key: string) =>
  Effect.promise(async () => {
    const keyBytes = new TextEncoder().encode(key)
    const bodyBytes = new TextEncoder().encode(body)
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyBytes,
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )

    const signature = await globalThis.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      bodyBytes
    )

    return Buffer.from(new Uint8Array(signature)).toString('base64')
  })

const withPatchedGlobal = (
  globalKey: 'btoa' | 'Buffer' | 'crypto' | 'TextEncoder',
  patchedValue: unknown,
  effect: Effect.Effect<void, unknown, never>
) =>
  Effect.acquireUseRelease(
    Effect.sync(() => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        globalKey
      )

      Object.defineProperty(globalThis, globalKey, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: patchedValue
      })

      return originalDescriptor
    }),
    () => effect,
    (originalDescriptor) =>
      Effect.sync(() => {
        if (originalDescriptor) {
          Object.defineProperty(globalThis, globalKey, originalDescriptor)
        } else {
          Reflect.deleteProperty(globalThis, globalKey)
        }
      })
  )

const expectFailureMessage = <A, E>(
  effect: Effect.Effect<A, E>,
  expectedMessage: string
) =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(effect)

    expect(exit._tag).toBe('Failure')
    if (exit._tag === 'Success') {
      return
    }

    const rendered = String(exit.cause)
    expect(rendered.includes(expectedMessage)).toBe(true)
  })

describe('AbacatePay webhooks utilities', () => {
  it.effect('exposes the expected signature header constant', () =>
    Effect.sync(() => {
      expect(ABACATEPAY_SIGNATURE_HEADER).toBe('x-webhook-signature')
    })
  )

  it.effect('decodes a valid webhook payload', () =>
    Effect.gen(function* () {
      const decoded = yield* decodeWebhookPayload(validPayload)
      expect(decoded).toEqual(validPayload)
    })
  )

  it.effect('fails for invalid webhook payload shape', () =>
    expectFailureMessage(
      decodeWebhookPayload({
        id: '',
        event: 'invalid.event',
        apiVersion: '2',
        devMode: 'true',
        data: {}
      }),
      'Invalid AbacatePay webhook payload'
    )
  )

  it.effect(
    'verifies webhook secrets using timing-safe comparison behavior',
    () =>
      Effect.sync(() => {
        expect(verifyWebhookSecret('abc123', 'abc123')).toBe(true)
        expect(verifyWebhookSecret('abc123', 'abc124')).toBe(false)
        expect(verifyWebhookSecret('abc123', 'abc1234')).toBe(false)
      })
  )

  it.effect(
    'handles sparse encoded bytes when comparing webhook secrets',
    () => {
      class SparseTextEncoder {
        encode() {
          return {
            length: 1,
            0: undefined
          }
        }
      }

      return withPatchedGlobal(
        'TextEncoder',
        SparseTextEncoder,
        Effect.sync(() => {
          expect(verifyWebhookSecret('left', 'right')).toBe(true)
        })
      )
    }
  )

  it.effect('verifies webhook signature and trims header whitespace', () =>
    Effect.gen(function* () {
      const signature = yield* signPayload(validPayloadBody, publicHmacKey)

      const isValid = yield* Effect.promise(() =>
        verifyWebhookSignature(
          validPayloadBody,
          `  ${signature}  `,
          publicHmacKey
        )
      )

      expect(isValid).toBe(true)
    })
  )

  it.effect('returns false for different webhook signatures', () =>
    Effect.gen(function* () {
      const signature = yield* signPayload(validPayloadBody, publicHmacKey)

      const mismatchedSameLength = signature.replace(replaceLastCharRegex, 'A')
      const mismatchedDifferentLength = `${signature}x`

      const sameLengthResult = yield* Effect.promise(() =>
        verifyWebhookSignature(
          validPayloadBody,
          mismatchedSameLength,
          publicHmacKey
        )
      )

      const differentLengthResult = yield* Effect.promise(() =>
        verifyWebhookSignature(
          validPayloadBody,
          mismatchedDifferentLength,
          publicHmacKey
        )
      )

      expect(sameLengthResult).toBe(false)
      expect(differentLengthResult).toBe(false)
    })
  )

  it.effect(
    'falls back to Buffer base64 encoding when btoa is unavailable',
    () =>
      Effect.gen(function* () {
        const signature = yield* signPayload(validPayloadBody, publicHmacKey)

        yield* withPatchedGlobal(
          'btoa',
          undefined,
          Effect.gen(function* () {
            const isValid = yield* Effect.promise(() =>
              verifyWebhookSignature(validPayloadBody, signature, publicHmacKey)
            )

            expect(isValid).toBe(true)
          })
        )
      })
  )

  it.effect('fails when no base64 encoder is available', () =>
    withPatchedGlobal(
      'btoa',
      undefined,
      withPatchedGlobal(
        'Buffer',
        undefined,
        expectFailureMessage(
          Effect.promise(() =>
            verifyWebhookSignature(
              validPayloadBody,
              'any-signature',
              publicHmacKey
            )
          ),
          'No base64 encoder available in this runtime.'
        )
      )
    )
  )

  it.effect('fails when Web Crypto API is unavailable', () =>
    withPatchedGlobal(
      'crypto',
      undefined,
      expectFailureMessage(
        Effect.promise(() =>
          verifyWebhookSignature(
            validPayloadBody,
            'any-signature',
            publicHmacKey
          )
        ),
        'Web Crypto API is not available in this runtime. Use Node >=18, Bun, Deno, or an Edge runtime with crypto.subtle support.'
      )
    )
  )

  it.effect('verifies signature and decodes valid webhook payload', () =>
    Effect.gen(function* () {
      const signature = yield* signPayload(validPayloadBody, publicHmacKey)

      const payload = yield* verifyAndDecodeWebhook({
        rawBody: validPayloadBody,
        signatureFromHeader: signature,
        publicHmacKey
      })

      expect(payload).toEqual(validPayload)
    })
  )

  it.effect('fails verifyAndDecodeWebhook with invalid signature', () =>
    expectFailureMessage(
      verifyAndDecodeWebhook({
        rawBody: validPayloadBody,
        signatureFromHeader: 'invalid-signature',
        publicHmacKey
      }),
      'Invalid AbacatePay webhook signature'
    )
  )

  it.effect('fails verifyAndDecodeWebhook with invalid JSON body', () =>
    Effect.gen(function* () {
      const invalidJson = '{ "id": "evt_123"'
      const signature = yield* signPayload(invalidJson, publicHmacKey)

      yield* expectFailureMessage(
        verifyAndDecodeWebhook({
          rawBody: invalidJson,
          signatureFromHeader: signature,
          publicHmacKey
        }),
        'Invalid JSON body for AbacatePay webhook'
      )
    })
  )

  it.effect('fails verifyAndDecodeWebhook for invalid decoded payload', () =>
    Effect.gen(function* () {
      const invalidPayloadBody = JSON.stringify({
        id: '',
        event: 'invalid.event',
        apiVersion: 2,
        devMode: true,
        data: {}
      })

      const signature = yield* signPayload(invalidPayloadBody, publicHmacKey)

      yield* expectFailureMessage(
        verifyAndDecodeWebhook({
          rawBody: invalidPayloadBody,
          signatureFromHeader: signature,
          publicHmacKey
        }),
        'Invalid AbacatePay webhook payload'
      )
    })
  )
})
