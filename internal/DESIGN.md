# Design Document: Pagamentos SDK

# 1. Vision

`pagamentos` is a high-level, unified SDK for the Brazilian payment ecosystem.
It provides a single interface to interact with multiple PSPs (Payment Service
Providers), allowing developers to switch providers, split traffic, and optimize
fees without changing business logic.

# 2. Ubiquitous Language (Hybrid Domain)

To ensure maximum precision with the Brazilian financial market and Central Bank
(BACEN) regulations, this SDK uses a hybrid naming convention:

- **English for Architectural Verbs**: create, get, list, refund, connect.
- **Portuguese for Business Entities**: pagamento, taxa, parcelas, cliente,
  reembolso, boleto.

| Concept      | SDK Term  | Notes                              |
| ------------ | --------- | ---------------------------------- |
| Payment      | Pagamento | The core entity.                   |
| Fee          | Taxa      | First-class citizen for routing.   |
| Installments | Parcelas  | Specific to Credit Card logic.     |
| Customer     | Cliente   | Standardized across all providers. |

# 3. Structural Design

## 3.1 Subpath Exports

The package is distributed as a single library with specialized entry points to
optimize bundle size and security:

- `pagamentos`: Server-side operations (Secrets, Database integration).
- `pagamentos/client`: Browser-side operations (Public keys, Tokenization).
- `pagamentos/react`: UI Components (QR Codes, Secure Fields).
- `pagamentos/providers`: Individual provider adapters for tree-shaking.

## 3.2 Implementation Engine

Internally, the SDK uses a functional core (powered by Effect) to manage
dependency injection, retries, and error tracking. This engine is bundled into
the distribution to remain an implementation detail; the end-user only interacts
with standard JavaScript Promises.

# 4. Canonical Models & Data Normalization

The SDK acts as a **Strict Translation Layer**. It prevents "Leaky Abstractions"
by enforcing a canonical schema while maintaining traceability to the provider.

## 4.1 Identification

- **Primary ID**: The id returned is always the original identifier from the
  provider. This ensures developers can cross-reference payments in the
  provider's dashboard.
- **Provider Tagging**: Every object includes a provider field (e.g., 'stone',
  'mercadopago') to route future actions (like refunds) correctly.

## 4.2 Data Normalization

Every provider adapter performs a two-way translation:

- **Status Mapping**: Provider-specific states (e.g., PAGO, succeeded, 1) are
  mapped to a unified StatusPagamento union: 'pendente' | 'pago' | 'falho' |
  'cancelado' | 'estornado' (etc).
- **Entity Standardizing**: Whether a provider uses full_name or
  first_name/last_name, the SDK normalizes this into a consistent Cliente
  object.
- **Monetary Consistency**: All amounts are handled as integers in centavos (BRL
  cents) to avoid floating-point inaccuracies.

# 5. Lifecycle & Pipeline

The SDK utilizes a pipeline for every request. Developers can hook into this
lifecycle for auditing, custom logic, or metrics. It's important to understand
that the hooks are executed in the order they are registered, and that they
**CAN'T** alter the core behavior of the SDK (e.g., changing providers or
skipping validation).

## 5.1 Lifecycle Hooks

The SDK exposes hooks at critical execution points:

| Hook          | Description                                                |
| ------------- | ---------------------------------------------------------- |
| beforeRequest | Before any logic. Used for validation or input enrichment. |
| beforeCreate  | After provider selection, before calling the Provider API. |
| afterCreate   | After a successful charge. Ideal for database updates.     |
| onError       | When any part of the pipeline fails.                       |
| afterRequest  | The final step, regardless of success or failure.          |

```ts
import { beforeRequest, afterCreate, onError } from 'pagamentos'

const pg = new Pagamentos({
  providers: [...],
  hooks: [
    beforeRequest((input) => console.log(`Starting ${input.operation}`)),
    afterCreate((pagamento, context) => {
      console.log(`Charged R$${pagamento.valor/100} via ${context.provider}`)
    }),
    onError((erro, context) => {
      Sentry.captureException(erro, { extra: context })
    })
  ]
})
```

## 5.2 Middleware Pipeline

In addition to hooks, pre-built middlewares handle cross-cutting concerns:

- **Idempotency**: Preventing duplicate charges using a chave_idempotencia.
- **Retries**: Automatic exponential backoff for network-level failures.
- **Circuit Breaker**: Temporarily disabling a provider if it exceeds a failure
  threshold.

# 6. Intelligent Orchestration

## 6.1 Routing Strategies

The SDK can dynamically choose the best provider for a transaction:

- **Menor Taxa (Lowest Fee)**: Automatically calculates the cheapest provider.
  (e.g., choosing a flat-fee provider for high-value transactions).
- **Prioridade (Priority)**: Uses a primary provider and falls back to a
  secondary if the first is down.
- **Condicional (Conditional)**: Custom logic (e.g., if (valor > 5000)
  use('stone')).

# 7. API Specification Example

```ts
const pagamento = await pg.pagamentos.create({
  valor: 15000,
  meio_pagamento: 'pix',
  cliente: {
    nome: 'João Silva',
    documento: { cpf: '12345678900' }
  }
})

console.log(
  `Pagamento criado com ID: ${pagamento.id} via ${pagamento.provider}`
)
```

## 7.1 Unified Error System

Errors are mapped from internal provider codes to a clear SDK hierarchy:

- `ValidationError`: Schema or document issues.
- `CardDeclinedError`: Declined, expired, or insufficient funds.
- `ProviderError`: Infrastructure or timeout issues.

# 8. Security Considerations

Sensitive card data is handled via `pagamentos/client`.

1. The frontend generates a token_cartao using the provider's vault.
2. The server-side SDK receives only the token_cartao, ensuring the merchant
   server remains out of PCI-DSS scope.
