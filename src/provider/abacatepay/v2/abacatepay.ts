import { FetchHttpClient } from '@effect/platform'
import { Effect, Redacted } from 'effect'
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
} from './effect/operations'
import {
  ABACATEPAY_SIGNATURE_HEADER,
  type AbacatePayWebhookPayload,
  decodeWebhookPayload,
  verifyAndDecodeWebhook,
  verifyWebhookSecret,
  verifyWebhookSignature
} from './effect/webhooks'

/**
 * Cliente async da AbacatePay (v2).
 *
 * Internamente usa Effect para tipagem e execução, mas expõe API baseada em Promise.
 */
export class AbacatePay {
  readonly checkouts: {
    create: AsyncOperation<typeof checkoutsCreate>
    list: AsyncOperation<typeof checkoutsList>
    get: AsyncOperation<typeof checkoutsGet>
  }

  readonly paymentLinks: {
    create: AsyncOperation<typeof paymentLinksCreate>
    list: AsyncOperation<typeof paymentLinksList>
    get: AsyncOperation<typeof paymentLinksGet>
  }

  readonly customers: {
    create: AsyncOperation<typeof customersCreate>
    list: AsyncOperation<typeof customersList>
    get: AsyncOperation<typeof customersGet>
    delete: AsyncOperation<typeof customersDelete>
  }

  readonly pixQrcode: {
    create: AsyncOperation<typeof pixQrcodeCreate>
    list: AsyncOperation<typeof pixQrcodeList>
    simulatePayment: AsyncOperation<typeof pixQrcodeSimulatePayment>
    check: AsyncOperation<typeof pixQrcodeCheck>
  }

  readonly coupons: {
    create: AsyncOperation<typeof couponsCreate>
    list: AsyncOperation<typeof couponsList>
    get: AsyncOperation<typeof couponsGet>
    delete: AsyncOperation<typeof couponsDelete>
    toggle: AsyncOperation<typeof couponsToggle>
  }

  readonly products: {
    create: AsyncOperation<typeof productsCreate>
    list: AsyncOperation<typeof productsList>
    get: AsyncOperation<typeof productsGet>
    delete: AsyncOperation<typeof productsDelete>
  }

  readonly subscriptions: {
    create: AsyncOperation<typeof subscriptionsCreate>
    list: AsyncOperation<typeof subscriptionsList>
  }

  readonly payouts: {
    create: AsyncOperation<typeof payoutsCreate>
    get: AsyncOperation<typeof payoutsGet>
    list: AsyncOperation<typeof payoutsList>
  }

  readonly pix: {
    create: AsyncOperation<typeof pixCreate>
    get: AsyncOperation<typeof pixGet>
    list: AsyncOperation<typeof pixList>
  }

  readonly webhooks: {
    readonly signatureHeader: typeof ABACATEPAY_SIGNATURE_HEADER
    verifySecret: (secretFromQuery: string, expectedSecret: string) => boolean
    verifySignature: (
      rawBody: string,
      signatureFromHeader: string,
      publicHmacKey: string
    ) => Promise<boolean>
    decodePayload: (payload: unknown) => Promise<AbacatePayWebhookPayload>
    verifyAndDecode: (input: {
      rawBody: string
      signatureFromHeader: string
      publicHmacKey: string
    }) => Promise<AbacatePayWebhookPayload>
  }

  constructor(config: AbacatePayConfig) {
    const runtimeConfig = {
      apiKey:
        typeof config.apiKey === 'string'
          ? Redacted.make(config.apiKey)
          : config.apiKey,
      baseUrl: config.baseUrl ?? 'https://api.abacatepay.com/v2'
    }

    this.checkouts = {
      create: wrapAsyncOperation(checkoutsCreate, runtimeConfig),
      list: wrapAsyncOperation(checkoutsList, runtimeConfig),
      get: wrapAsyncOperation(checkoutsGet, runtimeConfig)
    }

    this.paymentLinks = {
      create: wrapAsyncOperation(paymentLinksCreate, runtimeConfig),
      list: wrapAsyncOperation(paymentLinksList, runtimeConfig),
      get: wrapAsyncOperation(paymentLinksGet, runtimeConfig)
    }

    this.customers = {
      create: wrapAsyncOperation(customersCreate, runtimeConfig),
      list: wrapAsyncOperation(customersList, runtimeConfig),
      get: wrapAsyncOperation(customersGet, runtimeConfig),
      delete: wrapAsyncOperation(customersDelete, runtimeConfig)
    }

    this.pixQrcode = {
      create: wrapAsyncOperation(pixQrcodeCreate, runtimeConfig),
      list: wrapAsyncOperation(pixQrcodeList, runtimeConfig),
      simulatePayment: wrapAsyncOperation(
        pixQrcodeSimulatePayment,
        runtimeConfig
      ),
      check: wrapAsyncOperation(pixQrcodeCheck, runtimeConfig)
    }

    this.coupons = {
      create: wrapAsyncOperation(couponsCreate, runtimeConfig),
      list: wrapAsyncOperation(couponsList, runtimeConfig),
      get: wrapAsyncOperation(couponsGet, runtimeConfig),
      delete: wrapAsyncOperation(couponsDelete, runtimeConfig),
      toggle: wrapAsyncOperation(couponsToggle, runtimeConfig)
    }

    this.products = {
      create: wrapAsyncOperation(productsCreate, runtimeConfig),
      list: wrapAsyncOperation(productsList, runtimeConfig),
      get: wrapAsyncOperation(productsGet, runtimeConfig),
      delete: wrapAsyncOperation(productsDelete, runtimeConfig)
    }

    this.subscriptions = {
      create: wrapAsyncOperation(subscriptionsCreate, runtimeConfig),
      list: wrapAsyncOperation(subscriptionsList, runtimeConfig)
    }

    this.payouts = {
      create: wrapAsyncOperation(payoutsCreate, runtimeConfig),
      get: wrapAsyncOperation(payoutsGet, runtimeConfig),
      list: wrapAsyncOperation(payoutsList, runtimeConfig)
    }

    this.pix = {
      create: wrapAsyncOperation(pixCreate, runtimeConfig),
      get: wrapAsyncOperation(pixGet, runtimeConfig),
      list: wrapAsyncOperation(pixList, runtimeConfig)
    }

    this.webhooks = {
      signatureHeader: ABACATEPAY_SIGNATURE_HEADER,
      verifySecret: verifyWebhookSecret,
      verifySignature: verifyWebhookSignature,
      decodePayload: (payload) =>
        Effect.runPromise(decodeWebhookPayload(payload)),
      verifyAndDecode: (input) =>
        Effect.runPromise(verifyAndDecodeWebhook(input))
    }
  }
}

type AbacatePayConfig = {
  apiKey: string | Redacted.Redacted<string>
  baseUrl?: string
}

type AsyncOperation<Operation> = Operation extends {
  $inferOperation: (
    ...args: infer Args
  ) => Effect.Effect<infer Success, infer _E>
}
  ? (...args: Args) => Promise<Success>
  : never

type RuntimeConfig = {
  apiKey: Redacted.Redacted<string>
  baseUrl: string
}

const wrapAsyncOperation = <Operation>(
  operation: Operation,
  runtimeConfig: RuntimeConfig
) => {
  const operationRuntime = operation as {
    operation: (
      runtime: RuntimeConfig
    ) => (
      ...args: readonly unknown[]
    ) => Effect.Effect<unknown, unknown, unknown>
  }

  const effectOperation = operationRuntime.operation(runtimeConfig)

  return ((...args: unknown[]) =>
    Effect.runPromise(
      effectOperation(...args).pipe(Effect.provide(FetchHttpClient.layer))
    )) as AsyncOperation<Operation>
}
