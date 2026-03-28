import { Config, Context, Data, Effect, Layer } from 'effect'
import type {
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
  storeGet,
  subscriptionsCreate,
  subscriptionsList,
  trustMrrGet,
  trustMrrList,
  trustMrrMrr
} from './operations'

export class AbacatePayError extends Data.TaggedError('AbacatePayError')<{
  readonly message: string
  readonly status?: number
  readonly cause?: unknown
}> {}

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
  store: {
    get: typeof storeGet.$inferOperation
  }
  trustMrr: {
    mrr: typeof trustMrrMrr.$inferOperation
    get: typeof trustMrrGet.$inferOperation
    list: typeof trustMrrList.$inferOperation
  }
}

type AbacatePayLayerConfig = {
  apiKey: unknown
  baseURL?: string
}

const notImplemented = <
  Operation extends (
    ...args: readonly unknown[]
  ) => Effect.Effect<unknown, AbacatePayError>
>(
  name: string
): Operation =>
  ((..._args: readonly unknown[]) =>
    Effect.fail(
      new AbacatePayError({
        message: `Operation ${name} is not implemented yet`
      })
    )) as Operation

const makeService = (_config: AbacatePayLayerConfig): AbacatePayService => ({
  checkouts: {
    create:
      notImplemented<typeof checkoutsCreate.$inferOperation>(
        'checkouts.create'
      ),
    list: notImplemented<typeof checkoutsList.$inferOperation>(
      'checkouts.list'
    ),
    get: notImplemented<typeof checkoutsGet.$inferOperation>('checkouts.get')
  },
  paymentLinks: {
    create: notImplemented<typeof paymentLinksCreate.$inferOperation>(
      'paymentLinks.create'
    ),
    list: notImplemented<typeof paymentLinksList.$inferOperation>(
      'paymentLinks.list'
    ),
    get: notImplemented<typeof paymentLinksGet.$inferOperation>(
      'paymentLinks.get'
    )
  },
  customers: {
    create:
      notImplemented<typeof customersCreate.$inferOperation>(
        'customers.create'
      ),
    list: notImplemented<typeof customersList.$inferOperation>(
      'customers.list'
    ),
    get: notImplemented<typeof customersGet.$inferOperation>('customers.get'),
    delete:
      notImplemented<typeof customersDelete.$inferOperation>('customers.delete')
  },
  pixQrcode: {
    create:
      notImplemented<typeof pixQrcodeCreate.$inferOperation>(
        'pixQrcode.create'
      ),
    list: notImplemented<typeof pixQrcodeList.$inferOperation>(
      'pixQrcode.list'
    ),
    simulatePayment: notImplemented<
      typeof pixQrcodeSimulatePayment.$inferOperation
    >('pixQrcode.simulatePayment'),
    check:
      notImplemented<typeof pixQrcodeCheck.$inferOperation>('pixQrcode.check')
  },
  coupons: {
    create:
      notImplemented<typeof couponsCreate.$inferOperation>('coupons.create'),
    list: notImplemented<typeof couponsList.$inferOperation>('coupons.list'),
    get: notImplemented<typeof couponsGet.$inferOperation>('coupons.get'),
    delete:
      notImplemented<typeof couponsDelete.$inferOperation>('coupons.delete'),
    toggle:
      notImplemented<typeof couponsToggle.$inferOperation>('coupons.toggle')
  },
  products: {
    create:
      notImplemented<typeof productsCreate.$inferOperation>('products.create'),
    list: notImplemented<typeof productsList.$inferOperation>('products.list'),
    get: notImplemented<typeof productsGet.$inferOperation>('products.get'),
    delete:
      notImplemented<typeof productsDelete.$inferOperation>('products.delete')
  },
  subscriptions: {
    create: notImplemented<typeof subscriptionsCreate.$inferOperation>(
      'subscriptions.create'
    ),
    list: notImplemented<typeof subscriptionsList.$inferOperation>(
      'subscriptions.list'
    )
  },
  payouts: {
    create:
      notImplemented<typeof payoutsCreate.$inferOperation>('payouts.create'),
    get: notImplemented<typeof payoutsGet.$inferOperation>('payouts.get'),
    list: notImplemented<typeof payoutsList.$inferOperation>('payouts.list')
  },
  pix: {
    create: notImplemented<typeof pixCreate.$inferOperation>('pix.create'),
    get: notImplemented<typeof pixGet.$inferOperation>('pix.get'),
    list: notImplemented<typeof pixList.$inferOperation>('pix.list')
  },
  store: {
    get: notImplemented<typeof storeGet.$inferOperation>('store.get')
  },
  trustMrr: {
    mrr: notImplemented<typeof trustMrrMrr.$inferOperation>('trustMrr.mrr'),
    get: notImplemented<typeof trustMrrGet.$inferOperation>('trustMrr.get'),
    list: notImplemented<typeof trustMrrList.$inferOperation>('trustMrr.list')
  }
})

export class AbacatePay extends Context.Tag('@pagamentosdev/abacatepay/v2')<
  AbacatePay,
  AbacatePayService
>() {
  static layerConfig(config: Config.Config.Wrap<AbacatePayLayerConfig>) {
    return Layer.effect(
      AbacatePay,
      Config.unwrap(config).pipe(Effect.map(makeService))
    )
  }
}
