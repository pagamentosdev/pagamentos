/**
 * Integração com a API da [AbacatePay](https://abacatepay.com/).
 *
 * @param params Configurações para a integração com a AbacatePay.
 * @example
 * ```ts
 * import { Pagamentos, abacatepay } from 'pagamentos'
 *
 * const pagamentos = new Pagamentos({
 *   provider: abacatepay({
 *     apiKey: process.env.ABACATEPAY_API_KEY
 *   })
 * })
 * ```
 */
export function abacatepay(params: AbacatepayProviderParams) {
  const defaultParams: Partial<AbacatepayProviderParams> = {
    baseURL: 'https://api.abacatepay.com/'
  }

  const mergedParams: Required<AbacatepayProviderParams> = {
    ...defaultParams,
    ...params
  }
}

type AbacatepayProviderParams = {
  /**
   * Chave de API fornecida pela AbacatePay.
   *
   * Para mais informações, consulte a [documentação oficial da AbacatePay](https://docs.abacatepay.com/).
   */
  apiKey: string

  /**
   * URL base da API da AbacatePay. O valor padrão é `https://api.abacatepay.com/`.
   *
   * Você pode sobrescrever esse valor para usar uma URL personalizada, se necessário.
   */
  baseURL?: string
}
