/**
 * Integração com a API do [MercadoPago](https://www.mercadopago.com.br/).
 *
 * @param params Configurações para a integração com o MercadoPago.
 * @example
 * ```ts
 * import { Pagamentos, mercadopago } from 'pagamentos'
 *
 * const pagamentos = new Pagamentos({
 *   provider: mercadopago({
 *     apiKey: process.env.MERCADOPAGO_API_KEY
 *   })
 * })
 * ```
 */
export function mercadopago(params: MercadoPagoProviderParams) {
  const defaultParams: Partial<MercadoPagoProviderParams> = {
    baseURL: 'https://api.mercadopago.com/'
  }

  const mergedParams: Required<MercadoPagoProviderParams> = {
    ...defaultParams,
    ...params
  }
}

type MercadoPagoProviderParams = {
  /**
   * Chave de API fornecida pela MercadoPago.
   *
   * Para mais informações, consulte a [documentação oficial da MercadoPago](https://www.mercadopago.com.br/developers/).
   */
  apiKey: string

  /**
   * URL base da API da MercadoPago. O valor padrão é `https://api.mercadopago.com/`.
   *
   * Você pode sobrescrever esse valor para usar uma URL personalizada, se necessário.
   */
  baseURL?: string
}
