import { FetchHttpClient } from '@effect/platform'
import { Config, Context, Data, Effect, Layer } from 'effect'
import type { OperationRuntimeConfig } from '#internal/operation'
import {
  checkoutsCreate,
  checkoutsGet,
  checkoutsList,
  couponsCreate,
  couponsDelete,
  couponsGet,
  couponsList,
  couponsToggle,
  customersCreate,
  customersDelete,
  customersGet,
  customersList,
  paymentLinksCreate,
  paymentLinksGet,
  paymentLinksList,
  payoutsCreate,
  payoutsGet,
  payoutsList,
  pixCreate,
  pixGet,
  pixList,
  pixQrcodeCheck,
  pixQrcodeCreate,
  pixQrcodeList,
  pixQrcodeSimulatePayment,
  productsCreate,
  productsDelete,
  productsGet,
  productsList,
  subscriptionsCreate,
  subscriptionsList
} from './operations'
import type { AbacatePayWebhookPayload } from './webhooks'
import {
  ABACATEPAY_SIGNATURE_HEADER,
  AbacatePayWebhookError,
  verifyAndDecodeWebhook,
  verifyWebhookSecret
} from './webhooks'

export class AbacatePayError extends Data.TaggedError(
  '@pagamentosdev/abacatepay/v2/AbacatePayError'
)<{
  readonly message: string
  readonly status?: number
  readonly cause?: unknown
}> {}

const withHttpClient =
  <Args extends readonly unknown[], A, E>(
    fn: (...args: Args) => Effect.Effect<A, E>
  ) =>
  (...args: Args): Effect.Effect<A, E> =>
    fn(...args).pipe(Effect.provide(FetchHttpClient.layer))

const makeService = (config: AbacatePayLayerConfig): AbacatePayService => {
  const runtimeConfig: OperationRuntimeConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? 'https://api.abacatepay.com/v2'
  }

  const handleWebhook = <A, E, R>(
    request: Request,
    onEvent: (event: AbacatePayWebhookPayload) => Effect.Effect<A, E, R>
  ) =>
    Effect.gen(function* () {
      if (!config.webhooks) {
        return yield* new AbacatePayWebhookError({
          message:
            'Webhooks are not configured. Provide `webhooks.publicHmacKey` in AbacatePay.layerConfig.'
        })
      }

      const signature = request.headers.get(ABACATEPAY_SIGNATURE_HEADER)
      if (!signature) {
        return yield* new AbacatePayWebhookError({
          message: `Missing webhook signature header: ${ABACATEPAY_SIGNATURE_HEADER}`
        })
      }

      if (config.webhooks.secret) {
        const url = new URL(request.url)
        const queryParam = config.webhooks.secretQueryParam ?? 'webhookSecret'
        const secretFromQuery = url.searchParams.get(queryParam)

        if (!secretFromQuery) {
          return yield* new AbacatePayWebhookError({
            message: `Missing webhook secret query param: ${queryParam}`
          })
        }

        if (!verifyWebhookSecret(secretFromQuery, config.webhooks.secret)) {
          return yield* new AbacatePayWebhookError({
            message: 'Invalid AbacatePay webhook secret'
          })
        }
      }

      const rawBody = yield* Effect.promise(() => request.text())

      const payload = yield* verifyAndDecodeWebhook({
        rawBody,
        signatureFromHeader: signature,
        publicHmacKey: config.webhooks.publicHmacKey
      })

      return yield* onEvent(payload)
    })

  return {
    checkouts: {
      create: withHttpClient(checkoutsCreate.operation(runtimeConfig)),
      list: withHttpClient(checkoutsList.operation(runtimeConfig)),
      get: withHttpClient(checkoutsGet.operation(runtimeConfig))
    },
    paymentLinks: {
      create: withHttpClient(paymentLinksCreate.operation(runtimeConfig)),
      list: withHttpClient(paymentLinksList.operation(runtimeConfig)),
      get: withHttpClient(paymentLinksGet.operation(runtimeConfig))
    },
    customers: {
      create: withHttpClient(customersCreate.operation(runtimeConfig)),
      list: withHttpClient(customersList.operation(runtimeConfig)),
      get: withHttpClient(customersGet.operation(runtimeConfig)),
      delete: withHttpClient(customersDelete.operation(runtimeConfig))
    },
    pixQrcode: {
      create: withHttpClient(pixQrcodeCreate.operation(runtimeConfig)),
      list: withHttpClient(pixQrcodeList.operation(runtimeConfig)),
      simulatePayment: withHttpClient(
        pixQrcodeSimulatePayment.operation(runtimeConfig)
      ),
      check: withHttpClient(pixQrcodeCheck.operation(runtimeConfig))
    },
    coupons: {
      create: withHttpClient(couponsCreate.operation(runtimeConfig)),
      list: withHttpClient(couponsList.operation(runtimeConfig)),
      get: withHttpClient(couponsGet.operation(runtimeConfig)),
      delete: withHttpClient(couponsDelete.operation(runtimeConfig)),
      toggle: withHttpClient(couponsToggle.operation(runtimeConfig))
    },
    products: {
      create: withHttpClient(productsCreate.operation(runtimeConfig)),
      list: withHttpClient(productsList.operation(runtimeConfig)),
      get: withHttpClient(productsGet.operation(runtimeConfig)),
      delete: withHttpClient(productsDelete.operation(runtimeConfig))
    },
    subscriptions: {
      create: withHttpClient(subscriptionsCreate.operation(runtimeConfig)),
      list: withHttpClient(subscriptionsList.operation(runtimeConfig))
    },
    payouts: {
      create: withHttpClient(payoutsCreate.operation(runtimeConfig)),
      get: withHttpClient(payoutsGet.operation(runtimeConfig)),
      list: withHttpClient(payoutsList.operation(runtimeConfig))
    },
    pix: {
      create: withHttpClient(pixCreate.operation(runtimeConfig)),
      get: withHttpClient(pixGet.operation(runtimeConfig)),
      list: withHttpClient(pixList.operation(runtimeConfig))
    },
    webhooks: {
      handle: handleWebhook
    }
  }
}

export class AbacatePay extends Context.Tag(
  '@pagamentosdev/abacatepay/v2/AbacatePay'
)<AbacatePay, AbacatePayService>() {
  static layerConfig(config: Config.Config.Wrap<AbacatePayLayerConfig>) {
    return Layer.effect(
      AbacatePay,
      Config.unwrap(config).pipe(Effect.map(makeService))
    )
  }
}

export {
  ABACATEPAY_SIGNATURE_HEADER,
  AbacatePayWebhookError,
  abacatePayWebhookEventSchema,
  abacatePayWebhookSchema,
  decodeWebhookPayload,
  verifyAndDecodeWebhook,
  verifyWebhookSecret,
  verifyWebhookSignature
} from './webhooks'

type AbacatePayService = {
  checkouts: {
    create: typeof checkoutsCreate.$inferOperation
    list: typeof checkoutsList.$inferOperation
    get: typeof checkoutsGet.$inferOperation
  }
  paymentLinks: {
    create: typeof paymentLinksCreate.$inferOperation
    list: typeof paymentLinksList.$inferOperation
    get: typeof paymentLinksGet.$inferOperation
  }
  customers: {
    create: typeof customersCreate.$inferOperation
    list: typeof customersList.$inferOperation
    get: typeof customersGet.$inferOperation
    delete: typeof customersDelete.$inferOperation
  }
  pixQrcode: {
    create: typeof pixQrcodeCreate.$inferOperation
    list: typeof pixQrcodeList.$inferOperation
    simulatePayment: typeof pixQrcodeSimulatePayment.$inferOperation
    check: typeof pixQrcodeCheck.$inferOperation
  }
  coupons: {
    create: typeof couponsCreate.$inferOperation
    list: typeof couponsList.$inferOperation
    get: typeof couponsGet.$inferOperation
    delete: typeof couponsDelete.$inferOperation
    toggle: typeof couponsToggle.$inferOperation
  }
  products: {
    create: typeof productsCreate.$inferOperation
    list: typeof productsList.$inferOperation
    get: typeof productsGet.$inferOperation
    delete: typeof productsDelete.$inferOperation
  }
  subscriptions: {
    create: typeof subscriptionsCreate.$inferOperation
    list: typeof subscriptionsList.$inferOperation
  }
  payouts: {
    create: typeof payoutsCreate.$inferOperation
    get: typeof payoutsGet.$inferOperation
    list: typeof payoutsList.$inferOperation
  }
  pix: {
    create: typeof pixCreate.$inferOperation
    get: typeof pixGet.$inferOperation
    list: typeof pixList.$inferOperation
  }
  webhooks: {
    handle: <A, E, R>(
      request: Request,
      onEvent: (event: AbacatePayWebhookPayload) => Effect.Effect<A, E, R>
    ) => Effect.Effect<A, AbacatePayWebhookError | E, R>
  }
}

type AbacatePayLayerConfig = {
  apiKey: OperationRuntimeConfig['apiKey']
  baseUrl?: string
  webhooks?: {
    publicHmacKey: string
    secret?: string
    secretQueryParam?: string
  }
}
