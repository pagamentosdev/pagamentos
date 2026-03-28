import { Context, Data, Effect } from 'effect'
import type { checkoutsCreate, checkoutsList } from './operations'

export class AbacatePayError extends Data.TaggedError('AbacatePayError')<{
  readonly message: string
  readonly status?: number
  readonly cause?: unknown
}> {}

class AbacatePay extends Context.Tag('@pagamentosdev/abacatepay/v2')<
  AbacatePay,
  {
    checkouts: {
      create: typeof checkoutsCreate.$inferOperation
      list: typeof checkoutsList.$inferOperation
    }
  }
>() {}

export const program = Effect.gen(function* () {
  const abacate = yield* AbacatePay

  return yield* abacate.checkouts.create({
    body: {
      items: [
        {
          id: 'item1',
          quantity: 1
        }
      ]
    }
  })
})
