import { attest } from '@ark/attest'
import { Redacted } from 'effect'
import { it } from 'vitest'
import { AbacatePay } from './abacatepay'
import type { AbacatePayWebhookPayload } from './effect/webhooks'

type Operations = typeof import('./effect/operations')

type AsyncOperation<Operation> = Operation extends {
  $inferOperation: (
    ...args: infer Args
  ) => import('effect').Effect.Effect<infer Success, infer _E>
}
  ? (...args: Args) => Promise<Success>
  : never

type AsyncOperationOf<Name extends keyof Operations> = AsyncOperation<
  Operations[Name]
>

it('creates an abacatepay instance', () => {
  const client = new AbacatePay({
    apiKey: 'abacatepay_test_key'
  })

  attest<AbacatePay>(client)
  attest<'x-webhook-signature'>(client.webhooks.signatureHeader)
})

it('accepts redacted api keys', () => {
  const redactedApiKey = Redacted.make('abacatepay_test_key')
  const client = new AbacatePay({
    apiKey: redactedApiKey
  })

  attest<AbacatePay>(client)
})

it('exposes typed checkout operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'checkoutsCreate'>>(client.checkouts.create)
  attest<AsyncOperationOf<'checkoutsList'>>(client.checkouts.list)
  attest<AsyncOperationOf<'checkoutsGet'>>(client.checkouts.get)
})

it('exposes typed payment links operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'paymentLinksCreate'>>(client.paymentLinks.create)
  attest<AsyncOperationOf<'paymentLinksList'>>(client.paymentLinks.list)
  attest<AsyncOperationOf<'paymentLinksGet'>>(client.paymentLinks.get)
})

it('exposes typed customer operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'customersCreate'>>(client.customers.create)
  attest<AsyncOperationOf<'customersList'>>(client.customers.list)
  attest<AsyncOperationOf<'customersGet'>>(client.customers.get)
  attest<AsyncOperationOf<'customersDelete'>>(client.customers.delete)
})

it('exposes typed pix qrcode operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'pixQrcodeCreate'>>(client.pixQrcode.create)
  attest<AsyncOperationOf<'pixQrcodeList'>>(client.pixQrcode.list)
  attest<AsyncOperationOf<'pixQrcodeSimulatePayment'>>(
    client.pixQrcode.simulatePayment
  )
  attest<AsyncOperationOf<'pixQrcodeCheck'>>(client.pixQrcode.check)
})

it('exposes typed coupon operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'couponsCreate'>>(client.coupons.create)
  attest<AsyncOperationOf<'couponsList'>>(client.coupons.list)
  attest<AsyncOperationOf<'couponsGet'>>(client.coupons.get)
  attest<AsyncOperationOf<'couponsDelete'>>(client.coupons.delete)
  attest<AsyncOperationOf<'couponsToggle'>>(client.coupons.toggle)
})

it('exposes typed product operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'productsCreate'>>(client.products.create)
  attest<AsyncOperationOf<'productsList'>>(client.products.list)
  attest<AsyncOperationOf<'productsGet'>>(client.products.get)
  attest<AsyncOperationOf<'productsDelete'>>(client.products.delete)
})

it('exposes typed subscription operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'subscriptionsCreate'>>(client.subscriptions.create)
  attest<AsyncOperationOf<'subscriptionsList'>>(client.subscriptions.list)
})

it('exposes typed payout operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'payoutsCreate'>>(client.payouts.create)
  attest<AsyncOperationOf<'payoutsGet'>>(client.payouts.get)
  attest<AsyncOperationOf<'payoutsList'>>(client.payouts.list)
})

it('exposes typed pix operations', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<AsyncOperationOf<'pixCreate'>>(client.pix.create)
  attest<AsyncOperationOf<'pixGet'>>(client.pix.get)
  attest<AsyncOperationOf<'pixList'>>(client.pix.list)
})

it('exposes typed webhook helpers', () => {
  const client = new AbacatePay({ apiKey: 'abacatepay_test_key' })

  attest<(secretFromQuery: string, expectedSecret: string) => boolean>(
    client.webhooks.verifySecret
  )
  attest<
    (
      rawBody: string,
      signatureFromHeader: string,
      publicHmacKey: string
    ) => Promise<boolean>
  >(client.webhooks.verifySignature)
  attest<(payload: unknown) => Promise<AbacatePayWebhookPayload>>(
    client.webhooks.decodePayload
  )
  attest<
    (input: {
      rawBody: string
      signatureFromHeader: string
      publicHmacKey: string
    }) => Promise<AbacatePayWebhookPayload>
  >(client.webhooks.verifyAndDecode)
})
