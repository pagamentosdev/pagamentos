/**
 * Integração com a API da [Woovi](https://woovi.com/).
 *
 * @param params Configurações para a integração com a Woovi.
 * @example
 * ```ts
 * import { Pagamentos, woovi } from 'pagamentos'
 *
 * const pagamentos = new Pagamentos({
 *   provider: woovi({
 *     appId: process.env.WOOVI_APP_ID,
 *     mode: 'sandbox'
 *   })
 * })
 * ```
 */
export function woovi(params: WooviProviderParams) {
  const defaultParams: Partial<WooviProviderParams> = {
    baseURL:
      params.mode === 'sandbox'
        ? 'https://api.woovi-sandbox.com/'
        : 'https://api.woovi.com/'
  }

  const mergedParams: Required<WooviProviderParams> = {
    ...defaultParams,
    ...params
  }
}

type WooviProviderParams = {
  /**
   * Identificador do aplicativo fornecido pela Woovi.
   *
   * Para mais informações, consulte a [documentação oficial da Woovi](https://developers.woovi.com/docs/apis/api-getting-started).
   */
  appId: string

  /**
   * Modo de operação da Woovi. Pode ser `sandbox` para ambiente de testes ou
   * `production` para ambiente de produção.
   */
  mode: 'sandbox' | 'production'

  /**
   * URL base da API da Woovi. O valor padrão é baseado no modo de operação:
   * - Para `sandbox`: `https://api.woovi-sandbox.com/`
   * - Para `production`: `https://api.woovi.com/`.
   *
   * Você pode sobrescrever esse valor para usar uma URL personalizada, se necessário.
   */
  baseURL?: string
}
