export class Pagamentos {
  private readonly providers: any[]

  constructor(payload: PagamentosConstructorPayload) {
    this.providers = payload.providers
  }
}

type PagamentosConstructorPayload = {
  providers: any[]
}
