import { Schema } from 'effect'

export const Documento = Schema.Struct({
  /**
   * Tipo do documento. Pode ser 'CPF' ou 'CNPJ'.
   */
  tipo: Schema.Literal('CPF', 'CNPJ'),

  /**
   * Número do documento. Para CPF, deve conter 11 dígitos. Para CNPJ, deve
   * conter 14 dígitos.
   *
   * O número deve ser fornecido apenas com dígitos ou caracteres, sem pontos,
   * traços ou barras. Exemplo: `12345678901` para CPF ou `12345678000199` para
   * CNPJ.
   *
   * A partir de Julho de 2026, o CNPJ passará a aceitar caracteres
   * alfanuméricos, [clique aqui para saber mais](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico).
   */
  numero: Schema.String
})
export type Documento = Schema.Schema.Type<typeof Documento>

export const Endereco = Schema.Struct({
  /**
   * Código de Endereçamento Postal (CEP).
   *
   * Exemplo: `01310100`.
   */
  cep: Schema.String.pipe(Schema.optional),

  /**
   * Nome da rua, avenida, alameda, etc.
   *
   * Exemplo: `Av. Paulista`.
   */
  logradouro: Schema.String.pipe(Schema.optional),

  /**
   * Número do imóvel.
   *
   * Exemplo: `1000` ou `S/N` para sem número.
   */
  numero: Schema.String.pipe(Schema.optional),

  /**
   * Complemento do endereço, como apartamento, sala, bloco, etc.
   *
   * Exemplo: `Apto 42` ou `Sala 1201`.
   */
  complemento: Schema.String.pipe(Schema.optional),

  /**
   * Bairro ou distrito.
   *
   * Exemplo: `Bela Vista`.
   */
  bairro: Schema.String.pipe(Schema.optional),

  /**
   * Cidade ou município.
   *
   * Exemplo: `São Paulo`.
   */
  cidade: Schema.String.pipe(Schema.optional),

  /**
   * Sigla do estado (UF).
   *
   * Exemplo: `SP`, `RJ`, `MG`.
   */
  estado: Schema.String.pipe(Schema.optional),

  /**
   * País no formato ISO 3166-1 alpha-2.
   *
   * Exemplo: `BR`, `US`, `AR`.
   */
  pais: Schema.String.pipe(Schema.optional)
})
export type Endereco = Schema.Schema.Type<typeof Endereco>

export const Cliente = Schema.Struct({
  /**
   * Identificador único do cliente atribuído pelo provedor de pagamento.
   *
   * Este ID é gerado pelo provedor (AbacatePay, Woovi, MercadoPago, etc.) e é
   * usado para referenciar o cliente em operações futuras, como criar cobranças
   * ou consultar dados.
   */
  id: Schema.String,

  /**
   * Nome completo do cliente.
   *
   * Exemplo: `João Silva`, `Maria Oliveira Santos`.
   *
   * Este campo é normalizado a partir dos campos `first_name` e `last_name`
   * quando o provedor os fornece separadamente (ex: MercadoPago).
   */
  nome: Schema.String,

  /**
   * Endereço de e-mail do cliente.
   *
   * Exemplo: `cliente@exemplo.com.br`.
   *
   * Campo obrigatório para alguns provedores (ex: MercadoPago).
   */
  email: Schema.String.pipe(Schema.optional),

  /**
   * Telefone do cliente no formato E.164.
   *
   * Formato internacional completo incluindo código do país (55 para Brasil)
   * e código de área (DDD).
   *
   * Exemplo: `+5511987654321` para um celular em São Paulo.
   *
   * @see {@link https://en.wikipedia.org/wiki/E.164 | E.164}
   */
  telefone: Schema.String.pipe(Schema.optional),

  /**
   * Documento de identificação do cliente (CPF ou CNPJ).
   *
   * Usado para identificação fiscal e emissão de notas fiscais.
   * Cada provedor pode usar nomenclaturas diferentes (taxId, identification, etc.)
   * mas sempre mapeado para este formato canônico.
   */
  documento: Documento.pipe(Schema.optional),

  /**
   * Endereço completo do cliente.
   *
   * Inclui informações como CEP, logradouro, número, complemento, bairro,
   * cidade, estado e país.
   */
  endereco: Endereco.pipe(Schema.optional)
})
export type Cliente = Schema.Schema.Type<typeof Cliente>
