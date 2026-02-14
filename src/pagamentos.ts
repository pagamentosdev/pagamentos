export class Pagamentos {
  private readonly providers: any[]

  constructor(payload: PagamentosConstructorPayload) {
    this.providers = payload.providers
  }

  /**
   * Operações de clientes.
   */
  clientes() {
    return {
      /**
       * Cria um novo cliente.
       *
       * @param data Dados do cliente a ser criado.
       * @returns O cliente criado.
       */
      create: () => {}
    }
  }
}

type PagamentosConstructorPayload = {
  providers: any[]
}
