import { describe, expect, it } from '@effect/vitest'
import { Cause, Config, Effect } from 'effect'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { ABACATEPAY_SIGNATURE_HEADER, AbacatePay } from './abacatepay'

const useMocks = process.env.ABACATEPAY_DISABLE_MOCKS !== 'true'

const mockBaseUrl = 'https://abacatepay.mock/v2'
const apiKey = 'test_api_key'
const webhookPublicHmacKey = 'test_public_hmac_key'
const webhookSecret = 'test_webhook_secret'

const validWebhookPayload = {
  id: 'evt_123',
  event: 'checkout.completed',
  apiVersion: 2,
  devMode: true,
  data: {
    checkoutId: 'bill_123'
  }
} as const

const validWebhookBody = JSON.stringify(validWebhookPayload)

type AbacatePayLayerConfigInput = {
  apiKey: string
  baseUrl?: string
  webhooks?: {
    publicHmacKey: string
    secret?: string
    secretQueryParam?: string
  }
}

const server = setupServer()

if (useMocks) {
  server.listen({ onUnhandledRequest: 'error' })
}

const resetMockServer = Effect.sync(() => {
  if (useMocks) {
    server.resetHandlers()
  }
})

const closeMockServer = Effect.sync(() => {
  if (useMocks) {
    server.close()
  }
})

const resolveService = (config: AbacatePayLayerConfigInput) =>
  Effect.gen(function* () {
    return yield* AbacatePay
  }).pipe(Effect.provide(AbacatePay.layerConfig(Config.succeed(config))))

const signWebhookPayload = (rawBody: string, key: string) =>
  Effect.promise(async () => {
    const keyBytes = new TextEncoder().encode(key)
    const bodyBytes = new TextEncoder().encode(rawBody)

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

const makeCheckoutEnvelope = (id: string) => ({
  data: {
    id,
    externalId: null,
    url: `https://checkout.abacatepay.mock/${id}`,
    amount: 12_345,
    paidAmount: null,
    items: [{ id: 'prod_1', quantity: 1 }],
    status: 'PENDING',
    coupons: [],
    devMode: true,
    customerId: null,
    returnUrl: null,
    completionUrl: null,
    receiptUrl: null,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  error: null,
  success: true
})

const assertFailureMessage = <A, E>(
  effect: Effect.Effect<A, E>,
  expectedMessage: string
) =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(effect)

    expect(exit._tag).toBe('Failure')
    if (exit._tag === 'Success') {
      return
    }

    const rendered = Cause.pretty(exit.cause)
    expect(rendered.includes(expectedMessage)).toBe(true)
  })

describe('AbacatePay effect provider', () => {
  it.effect('executes checkouts.get with HTTP client wiring', () =>
    Effect.gen(function* () {
      yield* resetMockServer

      if (!useMocks) {
        const service = yield* resolveService({
          apiKey,
          baseUrl: 'http://127.0.0.1:1/v2',
          webhooks: {
            publicHmacKey: webhookPublicHmacKey
          }
        })

        const failedExit = yield* Effect.exit(
          service.checkouts.get({ query: { id: 'bill_abc' } })
        )

        expect(failedExit._tag).toBe('Failure')
        return
      }

      let observedAuthorizationHeader: string | null = null
      let observedCheckoutId: string | null = null

      server.use(
        http.get(`${mockBaseUrl}/checkouts/get`, ({ request }) => {
          observedAuthorizationHeader = request.headers.get('authorization')
          observedCheckoutId = new URL(request.url).searchParams.get('id')

          const checkoutId = observedCheckoutId ?? 'bill_fallback'
          return HttpResponse.json(makeCheckoutEnvelope(checkoutId))
        })
      )

      const service = yield* resolveService({
        apiKey,
        baseUrl: mockBaseUrl,
        webhooks: {
          publicHmacKey: webhookPublicHmacKey
        }
      })

      const response = yield* service.checkouts.get({
        query: { id: 'bill_abc' }
      })

      expect(response.success).toBe(true)
      expect(response.data.id).toBe('bill_abc')
      expect(observedAuthorizationHeader).toBe(`Bearer ${apiKey}`)
      expect(observedCheckoutId).toBe('bill_abc')
    })
  )

  it.effect('returns a webhook error when webhooks are not configured', () =>
    Effect.gen(function* () {
      yield* resetMockServer

      const service = yield* resolveService({ apiKey })

      const request = new Request('https://pagamentos.dev/webhook', {
        method: 'POST',
        body: validWebhookBody,
        headers: {
          [ABACATEPAY_SIGNATURE_HEADER]: 'any-signature'
        }
      })

      yield* assertFailureMessage(
        service.webhooks.handle(request, (event) => Effect.succeed(event)),
        'Webhooks are not configured. Provide `webhooks.publicHmacKey` in AbacatePay.layerConfig.'
      )
    })
  )

  it.effect('returns a webhook error when signature header is missing', () =>
    Effect.gen(function* () {
      yield* resetMockServer

      const service = yield* resolveService({
        apiKey,
        webhooks: {
          publicHmacKey: webhookPublicHmacKey
        }
      })

      const request = new Request('https://pagamentos.dev/webhook', {
        method: 'POST',
        body: validWebhookBody
      })

      yield* assertFailureMessage(
        service.webhooks.handle(request, (event) => Effect.succeed(event)),
        `Missing webhook signature header: ${ABACATEPAY_SIGNATURE_HEADER}`
      )
    })
  )

  it.effect(
    'returns a webhook error when default secret query param is missing',
    () =>
      Effect.gen(function* () {
        yield* resetMockServer

        const service = yield* resolveService({
          apiKey,
          webhooks: {
            publicHmacKey: webhookPublicHmacKey,
            secret: webhookSecret
          }
        })

        const request = new Request('https://pagamentos.dev/webhook', {
          method: 'POST',
          body: validWebhookBody,
          headers: {
            [ABACATEPAY_SIGNATURE_HEADER]: 'any-signature'
          }
        })

        yield* assertFailureMessage(
          service.webhooks.handle(request, (event) => Effect.succeed(event)),
          'Missing webhook secret query param: webhookSecret'
        )
      })
  )

  it.effect('returns a webhook error when secret query value is invalid', () =>
    Effect.gen(function* () {
      yield* resetMockServer

      const service = yield* resolveService({
        apiKey,
        webhooks: {
          publicHmacKey: webhookPublicHmacKey,
          secret: webhookSecret
        }
      })

      const request = new Request(
        'https://pagamentos.dev/webhook?webhookSecret=wrong-secret',
        {
          method: 'POST',
          body: validWebhookBody,
          headers: {
            [ABACATEPAY_SIGNATURE_HEADER]: 'any-signature'
          }
        }
      )

      yield* assertFailureMessage(
        service.webhooks.handle(request, (event) => Effect.succeed(event)),
        'Invalid AbacatePay webhook secret'
      )
    })
  )

  it.effect(
    'returns a webhook error when custom secret query param is missing',
    () =>
      Effect.gen(function* () {
        yield* resetMockServer

        const service = yield* resolveService({
          apiKey,
          webhooks: {
            publicHmacKey: webhookPublicHmacKey,
            secret: webhookSecret,
            secretQueryParam: 'secretToken'
          }
        })

        const request = new Request('https://pagamentos.dev/webhook', {
          method: 'POST',
          body: validWebhookBody,
          headers: {
            [ABACATEPAY_SIGNATURE_HEADER]: 'any-signature'
          }
        })

        yield* assertFailureMessage(
          service.webhooks.handle(request, (event) => Effect.succeed(event)),
          'Missing webhook secret query param: secretToken'
        )
      })
  )

  it.effect('propagates invalid signature webhook errors', () =>
    Effect.gen(function* () {
      yield* resetMockServer

      const service = yield* resolveService({
        apiKey,
        webhooks: {
          publicHmacKey: webhookPublicHmacKey,
          secret: webhookSecret
        }
      })

      const request = new Request(
        `https://pagamentos.dev/webhook?webhookSecret=${webhookSecret}`,
        {
          method: 'POST',
          body: validWebhookBody,
          headers: {
            [ABACATEPAY_SIGNATURE_HEADER]: 'invalid-signature'
          }
        }
      )

      yield* assertFailureMessage(
        service.webhooks.handle(request, (event) => Effect.succeed(event)),
        'Invalid AbacatePay webhook signature'
      )
    })
  )

  it.effect(
    'handles webhook successfully without query-secret validation',
    () =>
      Effect.gen(function* () {
        yield* resetMockServer

        const service = yield* resolveService({
          apiKey,
          webhooks: {
            publicHmacKey: webhookPublicHmacKey
          }
        })

        const signature = yield* signWebhookPayload(
          validWebhookBody,
          webhookPublicHmacKey
        )

        const request = new Request('https://pagamentos.dev/webhook', {
          method: 'POST',
          body: validWebhookBody,
          headers: {
            [ABACATEPAY_SIGNATURE_HEADER]: signature
          }
        })

        const result = yield* service.webhooks.handle(request, (event) =>
          Effect.succeed({
            id: event.id,
            event: event.event
          })
        )

        expect(result).toEqual({
          id: validWebhookPayload.id,
          event: validWebhookPayload.event
        })
      })
  )

  it.effect('handles webhook successfully when query-secret is valid', () =>
    Effect.gen(function* () {
      yield* resetMockServer

      const service = yield* resolveService({
        apiKey,
        webhooks: {
          publicHmacKey: webhookPublicHmacKey,
          secret: webhookSecret
        }
      })

      const signature = yield* signWebhookPayload(
        validWebhookBody,
        webhookPublicHmacKey
      )

      const request = new Request(
        `https://pagamentos.dev/webhook?webhookSecret=${webhookSecret}`,
        {
          method: 'POST',
          body: validWebhookBody,
          headers: {
            [ABACATEPAY_SIGNATURE_HEADER]: signature
          }
        }
      )

      const result = yield* service.webhooks.handle(request, (event) =>
        Effect.succeed(event.id)
      )

      expect(result).toBe(validWebhookPayload.id)
    })
  )

  it.effect('closes mock server after test run', () => closeMockServer)
})
