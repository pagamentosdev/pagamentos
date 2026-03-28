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
  metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  /**
   * Data e hora de criação do Checkout.
   */
  createdAt: Schema.String,
  /**
   * Data e hora da última atualização do Checkout.
   */
  updatedAt: Schema.String
})

const checkoutsCreateSchema = Schema.Struct({
  /**
   * Lista de itens incluídos na cobrança.
   *
   * Este é o único campo obrigatório — o valor total é calculado a partir destes itens.
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
   *
   * Se informado, o checkout será pré-preenchido com os dados deste cliente.
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
  metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }).pipe(
    Schema.optional
  )
})

const checkoutsCreateOutputSchema = Schema.Struct({
  /**
   * Dados do checkout criado.
   */
  data: checkoutDataSchema,
  /**
   * Mensagem de erro retornada pela API, quando aplicável.
   */
  error: Schema.NullOr(Schema.String),
  /**
   * Indica se a operação foi concluída com sucesso.
   */
  success: Schema.Boolean
})

const checkoutsListQuerySchema = Schema.Struct({
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
  ),
  /**
   * Filtrar por identificador único do Checkout.
   */
  id: Schema.String.pipe(Schema.optional),
  /**
   * Filtrar por identificador do Checkout no seu sistema.
   */
  externalId: Schema.String.pipe(Schema.optional),
  /**
   * Filtrar por status do Checkout.
   */
  status: checkoutStatus.pipe(Schema.optional),
  /**
   * Filtrar por e-mail do cliente associado.
   */
  email: Schema.String.pipe(Schema.optional),
  /**
   * Filtrar por CPF ou CNPJ do cliente associado.
   */
  taxId: Schema.String.pipe(Schema.optional)
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

const checkoutsListOutputSchema = Schema.Struct({
  /**
   * Lista de Checkouts.
   */
  data: Schema.Array(checkoutDataSchema),
  /**
   * Se a requisição obteve sucesso ou não.
   */
  success: Schema.Boolean,
  /**
   * Mensagem de erro retornada pela API, quando aplicável.
   */
  error: Schema.NullOr(Schema.String),
  /**
   * Informações de paginação baseada em cursor.
   */
  pagination: paginationCursorSchema
})

export const checkoutsCreate = defineOperation({
  url: '/checkouts/create',
  method: 'post',
  input: {
    body: checkoutsCreateSchema
  },
  output: {
    body: checkoutsCreateOutputSchema
  },
  error: AbacatePayError
})

export const checkoutsList = defineOperation({
  url: '/checkouts/list',
  method: 'get',
  input: {
    query: checkoutsListQuerySchema
  },
  output: {
    body: checkoutsListOutputSchema
  },
  error: AbacatePayError
})
