import { Schema } from 'effect'
import { defineOperation } from '#internal/operation'
import { AbacatePayError } from './abacatepay'

const acceptedMethods = Schema.Literal('PIX', 'CARD')

const checkoutStatus = Schema.Literal(
  'PENDING',
  'EXPIRED',
  'CANCELLED',
  'PAID',
  'REFUNDED'
)

const pixQrStatus = Schema.Literal(
  'PENDING',
  'EXPIRED',
  'CANCELLED',
  'PAID',
  'UNDER_DISPUTE',
  'REFUNDED',
  'REDEEMED',
  'APPROVED',
  'FAILED'
)

const transactionStatus = Schema.Literal(
  'PENDING',
  'EXPIRED',
  'CANCELLED',
  'COMPLETE',
  'REFUNDED'
)

const couponStatus = Schema.Literal('ACTIVE', 'INACTIVE', 'EXPIRED')
const couponDiscountKind = Schema.Literal('PERCENTAGE', 'FIXED')
const productStatus = Schema.Literal('ACTIVE', 'INACTIVE')
const productCycle = Schema.Literal(
  'WEEKLY',
  'MONTHLY',
  'SEMIANNUALLY',
  'ANNUALLY'
)
const pixKeyType = Schema.Literal(
  'CPF',
  'CNPJ',
  'PHONE',
  'EMAIL',
  'RANDOM',
  'BR_CODE'
)
const transactionKind = Schema.Literal('PAYMENT', 'WITHDRAW')

const metadataSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown
})

const paginationCursorSchema = Schema.Struct({
  /**
   * Indica se existe mais itens para carregar.
   */
  hasMore: Schema.Boolean,
  /**
   * Cursor para próxima página (usar em after).
   */
  next: Schema.NullOr(Schema.String),
  /**
   * Cursor para página anterior (usar em before).
   */
  before: Schema.NullOr(Schema.String)
})

const listQueryBaseSchema = Schema.Struct({
  /**
   * Cursor para buscar itens após este ponto.
   */
  after: Schema.String.pipe(Schema.optional),
  /**
   * Cursor para buscar itens antes deste ponto.
   */
  before: Schema.String.pipe(Schema.optional),
  /**
   * Quantidade de itens por página (1-100).
   */
  limit: Schema.Int.pipe(
    Schema.greaterThanOrEqualTo(1),
    Schema.lessThanOrEqualTo(100),
    Schema.optional
  )
})

const checkoutItem = Schema.Struct({
  id: Schema.NonEmptyString,
  quantity: Schema.Int.pipe(Schema.positive())
})

const checkoutDataSchema = Schema.Struct({
  /**
   * Identificador único do Checkout.
   */
  id: Schema.NonEmptyString,
  /**
   * ID do Checkout no seu sistema.
   */
  externalId: Schema.NullOr(Schema.String),
  /**
   * URL onde o usuário pode concluir o pagamento.
   */
  url: Schema.NonEmptyString,
  /**
   * Valor total a ser pago em centavos.
   */
  amount: Schema.Number,
  /**
   * Valor já pago em centavos. Null se ainda não foi pago.
   */
  paidAmount: Schema.NullOr(Schema.Number),
  /**
   * Lista de itens no Checkout.
   */
  items: Schema.Array(checkoutItem),
  /**
   * Status atual do Checkout.
   */
  status: checkoutStatus,
  /**
   * Lista de cupons aplicados no Checkout.
   */
  coupons: Schema.Array(Schema.String),
  /**
   * Indica se a cobrança foi criada em ambiente de testes.
   */
  devMode: Schema.Boolean,
  /**
   * ID do cliente associado ao Checkout.
   */
  customerId: Schema.NullOr(Schema.String),
  /**
   * URL para onde o cliente será redirecionado ao clicar em "Voltar".
   */
  returnUrl: Schema.NullOr(Schema.String),
  /**
   * URL para onde o cliente será redirecionado após o pagamento.
   */
  completionUrl: Schema.NullOr(Schema.String),
  /**
   * URL do comprovante de pagamento.
   */
  receiptUrl: Schema.NullOr(Schema.String),
  /**
   * Metadados adicionais do Checkout.
   */
  metadata: metadataSchema,
  /**
   * Data e hora de criação do Checkout.
   */
  createdAt: Schema.String,
  /**
   * Data e hora da última atualização do Checkout.
   */
  updatedAt: Schema.String
})

const checkoutInputSchema = Schema.Struct({
  /**
   * Lista de itens incluídos na cobrança.
   */
  items: Schema.NonEmptyArray(checkoutItem),
  /**
   * Métodos de pagamento disponíveis. Padrão ["PIX", "CARD"].
   */
  methods: Schema.NonEmptyArray(acceptedMethods).pipe(Schema.optional),
  /**
   * URL para onde o cliente será redirecionado ao clicar em "Voltar" no checkout.
   */
  returnUrl: Schema.String.pipe(Schema.optional),
  /**
   * URL para onde o cliente será redirecionado após o pagamento ser concluído.
   */
  completionUrl: Schema.String.pipe(Schema.optional),
  /**
   * ID de um cliente já cadastrado na sua loja.
   */
  customerId: Schema.String.pipe(Schema.optional),
  /**
   * Lista de cupons que podem ser utilizados nesta cobrança.
   */
  coupons: Schema.Array(Schema.String).pipe(
    Schema.maxItems(50),
    Schema.optional
  ),
  /**
   * ID da cobrança no seu sistema, caso queira manter uma referência própria.
   */
  externalId: Schema.String.pipe(Schema.optional),
  /**
   * Metadados adicionais da cobrança. Campo livre para a sua aplicação.
   */
  metadata: metadataSchema.pipe(Schema.optional)
})

const checkoutEnvelopeSchema = Schema.Struct({
  data: checkoutDataSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const checkoutListEnvelopeSchema = Schema.Struct({
  data: Schema.Array(checkoutDataSchema),
  success: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  pagination: paginationCursorSchema
})

const customerSchema = Schema.Struct({
  id: Schema.String,
  devMode: Schema.Boolean,
  name: Schema.String,
  cellphone: Schema.String,
  email: Schema.String,
  taxId: Schema.String,
  country: Schema.String.pipe(Schema.optional),
  zipCode: Schema.String.pipe(Schema.optional),
  metadata: metadataSchema.pipe(Schema.optional)
})

const customerCreateInputSchema = Schema.Struct({
  /**
   * E-mail do cliente (obrigatório).
   */
  email: Schema.String,
  /**
   * Nome completo do seu cliente (opcional).
   */
  name: Schema.String.pipe(Schema.optional),
  /**
   * Celular do cliente (opcional).
   */
  cellphone: Schema.String.pipe(Schema.optional),
  /**
   * CPF ou CNPJ válido do cliente (opcional).
   */
  taxId: Schema.String.pipe(Schema.optional),
  /**
   * CEP do cliente (opcional).
   */
  zipCode: Schema.String.pipe(Schema.optional),
  /**
   * Metadados adicionais do cliente.
   */
  metadata: metadataSchema.pipe(Schema.optional)
})

const customerEnvelopeSchema = Schema.Struct({
  data: customerSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const customerListEnvelopeSchema = Schema.Struct({
  data: Schema.Array(customerSchema),
  success: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  pagination: paginationCursorSchema
})

const transparentCustomerSchema = Schema.Struct({
  name: Schema.String,
  cellphone: Schema.String,
  email: Schema.String,
  taxId: Schema.String
})

const pixQrSchema = Schema.Struct({
  id: Schema.String,
  amount: Schema.Number,
  status: pixQrStatus,
  devMode: Schema.Boolean,
  brCode: Schema.String,
  brCodeBase64: Schema.String,
  platformFee: Schema.Number,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  expiresAt: Schema.String,
  metadata: metadataSchema.pipe(Schema.optional)
})

const pixQrcodeCreateInputSchema = Schema.Struct({
  /**
   * Método de pagamento. Hoje apenas PIX é suportado.
   */
  method: Schema.Literal('PIX'),
  /**
   * Dados da cobrança PIX.
   */
  data: Schema.Struct({
    amount: Schema.Number,
    expiresIn: Schema.Number.pipe(Schema.optional),
    description: Schema.String.pipe(Schema.maxLength(140), Schema.optional),
    customer: transparentCustomerSchema.pipe(Schema.optional),
    metadata: metadataSchema.pipe(Schema.optional)
  })
})

const pixQrcodeEnvelopeSchema = Schema.Struct({
  data: pixQrSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const pixQrcodeListEnvelopeSchema = Schema.Struct({
  data: Schema.Array(pixQrSchema),
  success: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  pagination: paginationCursorSchema
})

const pixQrcodeCheckDataSchema = Schema.Struct({
  id: Schema.String,
  status: pixQrStatus,
  expiresAt: Schema.String
})

const pixQrcodeCheckEnvelopeSchema = Schema.Struct({
  data: pixQrcodeCheckDataSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const couponCreateSchema = Schema.Struct({
  code: Schema.String,
  notes: Schema.String.pipe(Schema.optional),
  maxRedeems: Schema.Number.pipe(Schema.optional),
  discountKind: couponDiscountKind,
  discount: Schema.Number,
  metadata: metadataSchema.pipe(Schema.optional)
})

const couponSchema = Schema.Struct({
  id: Schema.String,
  notes: Schema.String.pipe(Schema.optional),
  maxRedeems: Schema.Int.pipe(Schema.optional),
  redeemsCount: Schema.Int.pipe(Schema.optional),
  discountKind: couponDiscountKind,
  discount: Schema.Number,
  devMode: Schema.Boolean.pipe(Schema.optional),
  status: couponStatus,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  metadata: metadataSchema.pipe(Schema.optional)
})

const couponEnvelopeSchema = Schema.Struct({
  data: couponSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const couponListEnvelopeSchema = Schema.Struct({
  data: Schema.Array(couponSchema),
  success: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  pagination: paginationCursorSchema
})

const productSchema = Schema.Struct({
  externalId: Schema.String,
  name: Schema.String,
  description: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  price: Schema.Number,
  devMode: Schema.Boolean,
  currency: Schema.Literal('BRL'),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  status: productStatus,
  id: Schema.String,
  cycle: Schema.NullOr(productCycle)
})

const productCreateSchema = Schema.Struct({
  externalId: Schema.String,
  name: Schema.String,
  price: Schema.Number.pipe(Schema.greaterThanOrEqualTo(1)),
  currency: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  imageUrl: Schema.NullOr(Schema.String).pipe(Schema.optional),
  cycle: Schema.NullOr(productCycle).pipe(Schema.optional)
})

const productEnvelopeSchema = Schema.Struct({
  data: productSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const productListEnvelopeSchema = Schema.Struct({
  data: Schema.Array(productSchema),
  success: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  pagination: paginationCursorSchema
})

const transactionSchema = Schema.Struct({
  id: Schema.String,
  status: transactionStatus,
  devMode: Schema.Boolean,
  receiptUrl: Schema.NullOr(Schema.String),
  kind: transactionKind.pipe(Schema.optional),
  amount: Schema.Number,
  platformFee: Schema.Number,
  externalId: Schema.String.pipe(Schema.optional),
  createdAt: Schema.String,
  updatedAt: Schema.String
})

const transactionEnvelopeSchema = Schema.Struct({
  data: transactionSchema,
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean
})

const transactionListEnvelopeSchema = Schema.Struct({
  data: Schema.Array(transactionSchema),
  success: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  pagination: paginationCursorSchema
})

const pixKeySchema = Schema.Struct({
  key: Schema.String,
  type: pixKeyType
})

const pixCreateInputSchema = Schema.Struct({
  amount: Schema.Number.pipe(Schema.greaterThanOrEqualTo(1)),
  externalId: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  pix: pixKeySchema
})

const storeSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  balance: Schema.Struct({
    available: Schema.Number,
    pending: Schema.Number,
    blocked: Schema.Number
  })
})

const storeGetOutputSchema = Schema.Struct({
  data: Schema.NullOr(storeSchema),
  error: Schema.NullOr(Schema.String),
  success: Schema.Boolean.pipe(Schema.optional)
})

const trustMrrMrrOutputSchema = Schema.Struct({
  data: Schema.Struct({
    mrr: Schema.Number,
    totalActiveSubscriptions: Schema.Int
  }),
  error: Schema.NullOr(Schema.String)
})

const trustMrrGetOutputSchema = Schema.Struct({
  data: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    website: Schema.String,
    createdAt: Schema.String
  }),
  error: Schema.NullOr(Schema.String)
})

const trustMrrListOutputSchema = Schema.Struct({
  data: Schema.Struct({
    totalRevenue: Schema.Number,
    totalTransactions: Schema.Int,
    transactionsPerDay: Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        amount: Schema.Number,
        count: Schema.Int
      })
    })
  }),
  error: Schema.NullOr(Schema.String)
})

export const checkoutsCreate = defineOperation({
  url: '/checkouts/create',
  method: 'post',
  input: {
    body: checkoutInputSchema
  },
  output: {
    body: checkoutEnvelopeSchema
  },
  error: AbacatePayError
})

export const checkoutsList = defineOperation({
  url: '/checkouts/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional),
      status: checkoutStatus.pipe(Schema.optional),
      email: Schema.String.pipe(Schema.optional),
      taxId: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: checkoutListEnvelopeSchema
  },
  error: AbacatePayError
})

export const checkoutsGet = defineOperation({
  url: '/checkouts/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: checkoutEnvelopeSchema
  },
  error: AbacatePayError
})

export const paymentLinksCreate = defineOperation({
  url: '/payment-links/create',
  method: 'post',
  input: {
    body: Schema.Struct({
      frequency: Schema.Literal('MULTIPLE_PAYMENTS').pipe(Schema.optional),
      items: Schema.NonEmptyArray(checkoutItem),
      methods: Schema.NonEmptyArray(acceptedMethods).pipe(Schema.optional),
      returnUrl: Schema.String.pipe(Schema.optional),
      completionUrl: Schema.String.pipe(Schema.optional),
      coupons: Schema.Array(Schema.String).pipe(
        Schema.maxItems(50),
        Schema.optional
      ),
      externalId: Schema.String.pipe(Schema.optional),
      metadata: metadataSchema.pipe(Schema.optional)
    })
  },
  output: {
    body: checkoutEnvelopeSchema
  },
  error: AbacatePayError
})

export const paymentLinksList = defineOperation({
  url: '/payment-links/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional),
      status: checkoutStatus.pipe(Schema.optional)
    })
  },
  output: {
    body: Schema.Struct({
      data: Schema.Array(checkoutDataSchema),
      success: Schema.Boolean,
      error: Schema.NullOr(Schema.String),
      pagination: paginationCursorSchema
    })
  },
  error: AbacatePayError
})

export const paymentLinksGet = defineOperation({
  url: '/payment-links/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: Schema.Struct({
      data: checkoutDataSchema,
      error: Schema.NullOr(Schema.String),
      success: Schema.Boolean
    })
  },
  error: AbacatePayError
})

export const customersCreate = defineOperation({
  url: '/customers/create',
  method: 'post',
  input: {
    body: customerCreateInputSchema
  },
  output: {
    body: customerEnvelopeSchema
  },
  error: AbacatePayError
})

export const customersList = defineOperation({
  url: '/customers/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      email: Schema.String.pipe(Schema.optional),
      taxId: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: customerListEnvelopeSchema
  },
  error: AbacatePayError
})

export const customersGet = defineOperation({
  url: '/customers/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: customerEnvelopeSchema
  },
  error: AbacatePayError
})

export const customersDelete = defineOperation({
  url: '/customers/delete',
  method: 'post',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: customerEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixQrcodeCreate = defineOperation({
  url: '/transparents/create',
  method: 'post',
  input: {
    body: pixQrcodeCreateInputSchema
  },
  output: {
    body: pixQrcodeEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixQrcodeList = defineOperation({
  url: '/transparents/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      status: Schema.Literal(
        'PENDING',
        'EXPIRED',
        'CANCELLED',
        'PAID',
        'REFUNDED'
      ).pipe(Schema.optional)
    })
  },
  output: {
    body: pixQrcodeListEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixQrcodeSimulatePayment = defineOperation({
  url: '/transparents/simulate-payment',
  method: 'post',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    }),
    body: Schema.Struct({
      metadata: metadataSchema.pipe(Schema.optional)
    })
  },
  output: {
    body: pixQrcodeEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixQrcodeCheck = defineOperation({
  url: '/transparents/check',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: pixQrcodeCheckEnvelopeSchema
  },
  error: AbacatePayError
})

export const couponsCreate = defineOperation({
  url: '/coupons/create',
  method: 'post',
  input: {
    body: couponCreateSchema
  },
  output: {
    body: couponEnvelopeSchema
  },
  error: AbacatePayError
})

export const couponsList = defineOperation({
  url: '/coupons/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      status: couponStatus.pipe(Schema.optional)
    })
  },
  output: {
    body: couponListEnvelopeSchema
  },
  error: AbacatePayError
})

export const couponsGet = defineOperation({
  url: '/coupons/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: couponEnvelopeSchema
  },
  error: AbacatePayError
})

export const couponsDelete = defineOperation({
  url: '/coupons/delete',
  method: 'post',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: couponEnvelopeSchema
  },
  error: AbacatePayError
})

export const couponsToggle = defineOperation({
  url: '/coupons/toggle',
  method: 'post',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: couponEnvelopeSchema
  },
  error: AbacatePayError
})

export const productsCreate = defineOperation({
  url: '/products/create',
  method: 'post',
  input: {
    body: productCreateSchema
  },
  output: {
    body: productEnvelopeSchema
  },
  error: AbacatePayError
})

export const productsList = defineOperation({
  url: '/products/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional),
      status: productStatus.pipe(Schema.optional)
    })
  },
  output: {
    body: productListEnvelopeSchema
  },
  error: AbacatePayError
})

export const productsGet = defineOperation({
  url: '/products/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: productEnvelopeSchema
  },
  error: AbacatePayError
})

export const productsDelete = defineOperation({
  url: '/products/delete',
  method: 'post',
  input: {
    query: Schema.Struct({
      id: Schema.NonEmptyString
    })
  },
  output: {
    body: productEnvelopeSchema
  },
  error: AbacatePayError
})

export const subscriptionsCreate = defineOperation({
  url: '/subscriptions/create',
  method: 'post',
  input: {
    body: Schema.Struct({
      items: Schema.NonEmptyArray(checkoutItem).pipe(Schema.maxItems(1)),
      methods: Schema.NonEmptyArray(acceptedMethods).pipe(Schema.optional),
      returnUrl: Schema.String.pipe(Schema.optional),
      completionUrl: Schema.String.pipe(Schema.optional),
      customerId: Schema.String.pipe(Schema.optional),
      coupons: Schema.Array(Schema.String).pipe(
        Schema.maxItems(50),
        Schema.optional
      ),
      externalId: Schema.String.pipe(Schema.optional),
      metadata: metadataSchema.pipe(Schema.optional)
    })
  },
  output: {
    body: checkoutEnvelopeSchema
  },
  error: AbacatePayError
})

export const subscriptionsList = defineOperation({
  url: '/subscriptions/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional),
      status: checkoutStatus.pipe(Schema.optional),
      email: Schema.String.pipe(Schema.optional),
      taxId: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: checkoutListEnvelopeSchema
  },
  error: AbacatePayError
})

export const payoutsCreate = defineOperation({
  url: '/payouts/create',
  method: 'post',
  input: {
    body: Schema.Struct({
      amount: Schema.Number.pipe(Schema.greaterThanOrEqualTo(350)),
      description: Schema.String.pipe(Schema.optional),
      externalId: Schema.String
    })
  },
  output: {
    body: transactionEnvelopeSchema
  },
  error: AbacatePayError
})

export const payoutsGet = defineOperation({
  url: '/payouts/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      externalId: Schema.NonEmptyString
    })
  },
  output: {
    body: transactionEnvelopeSchema
  },
  error: AbacatePayError
})

export const payoutsList = defineOperation({
  url: '/payouts/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional),
      status: transactionStatus.pipe(Schema.optional)
    })
  },
  output: {
    body: transactionListEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixCreate = defineOperation({
  url: '/pix/send',
  method: 'post',
  input: {
    body: pixCreateInputSchema
  },
  output: {
    body: transactionEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixGet = defineOperation({
  url: '/pix/get',
  method: 'get',
  input: {
    query: Schema.Struct({
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional)
    })
  },
  output: {
    body: transactionEnvelopeSchema
  },
  error: AbacatePayError
})

export const pixList = defineOperation({
  url: '/pix/list',
  method: 'get',
  input: {
    query: Schema.Struct({
      ...listQueryBaseSchema.fields,
      id: Schema.String.pipe(Schema.optional),
      externalId: Schema.String.pipe(Schema.optional),
      status: transactionStatus.pipe(Schema.optional)
    })
  },
  output: {
    body: transactionListEnvelopeSchema
  },
  error: AbacatePayError
})

export const storeGet = defineOperation({
  url: '/store/get',
  method: 'get',
  output: {
    body: storeGetOutputSchema
  },
  error: AbacatePayError
})

export const trustMrrMrr = defineOperation({
  url: '/public-mrr/mrr',
  method: 'get',
  output: {
    body: trustMrrMrrOutputSchema
  },
  error: AbacatePayError
})

export const trustMrrGet = defineOperation({
  url: '/public-mrr/merchant-info',
  method: 'get',
  output: {
    body: trustMrrGetOutputSchema
  },
  error: AbacatePayError
})

export const trustMrrList = defineOperation({
  url: '/public-mrr/revenue',
  method: 'get',
  input: {
    query: Schema.Struct({
      startDate: Schema.String,
      endDate: Schema.String
    })
  },
  output: {
    body: trustMrrListOutputSchema
  },
  error: AbacatePayError
})
