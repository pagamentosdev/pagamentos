import { Context, Data } from 'effect'
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

export class AbacatePay extends Context.Tag('@pagamentosdev/abacatepay/v2')<
  AbacatePay,
  {
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
>() {}
