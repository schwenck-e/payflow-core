# 📐 Modelagem Estrutural & Comportamental (UML 2.5)

**Projeto:** PayFlow Core - Gateway de Pagamentos e Ledger Financeiro Imutável  
**Referência SRS:** `thoughts/shared/requirements/2026-10-06-srs-specification.md`  
**Analista de Sistemas:** `systems_analyst`  
**Data:** 2026-10-06  
**Versão:** 1.0.0  

---

## 🏗️ 1. Diagrama de Classes UML (Modelo Estrutural de Domínio)

```mermaid
classDiagram
    direction TB

    class Merchant {
        -String id
        -String name
        -String document
        -String email
        -Boolean active
        -DateTime createdAt
        +createApiKey(name: String): ApiKey
        +getWalletAccount(): Account
    }

    class ApiKey {
        -String id
        -String merchantId
        -String keyHash
        -String prefix
        -String name
        -Boolean revoked
        -DateTime createdAt
        +verifyKey(rawKey: String): Boolean
        +revoke(): Void
    }

    class AccountType {
        <<enumeration>>
        ASSET
        LIABILITY
        EQUITY
        REVENUE
        EXPENSE
    }

    class Account {
        -String id
        -String? merchantId
        -String code
        -String name
        -AccountType type
        -String currency
        -Boolean allowOverdraft
        -BigInt currentBalanceInCents
        -DateTime createdAt
        +canDebit(amountInCents: BigInt): Boolean
        +applyEntry(entry: LedgerEntry): Void
    }

    class EntryDirection {
        <<enumeration>>
        DEBIT
        CREDIT
    }

    class LedgerEntry {
        -String id
        -String transactionId
        -String accountId
        -EntryDirection direction
        -BigInt amountInCents
        -DateTime createdAt
        +isDebit(): Boolean
        +isCredit(): Boolean
    }

    class TransactionType {
        <<enumeration>>
        PAYMENT_CAPTURE
        REFUND
        PAYOUT
        FEE_ASSESSMENT
        MANUAL_ADJUSTMENT
    }

    class LedgerTransaction {
        -String id
        -String referenceType
        -String referenceId
        -TransactionType type
        -String description
        -DateTime postedAt
        -List~LedgerEntry~ entries
        +validateBalance(): Boolean
        +getDebitTotal(): BigInt
        +getCreditTotal(): BigInt
        +addEntry(entry: LedgerEntry): Void
    }

    class PaymentMethod {
        <<enumeration>>
        PIX
        CREDIT_CARD
        BOLETO
    }

    class ChargeStatus {
        <<enumeration>>
        PENDING
        AUTHORIZED
        PAID
        FAILED
        REFUNDED
    }

    class Charge {
        -String id
        -String merchantId
        -BigInt amountInCents
        -String currency
        -PaymentMethod paymentMethod
        -ChargeStatus status
        -String? customerName
        -String? customerEmail
        -String? customerDocument
        -String? cardLast4
        -String? cardBrand
        -String? pixQrCode
        -String? boletoBarcode
        -BigInt feeAmountInCents
        -BigInt netAmountInCents
        -DateTime createdAt
        -DateTime? paidAt
        +authorize(): Void
        +capture(feeCents: BigInt): LedgerTransaction
        +fail(reason: String): Void
        +refund(amountCents: BigInt): Refund
    }

    class Refund {
        -String id
        -String chargeId
        -BigInt amountInCents
        -String reason
        -DateTime createdAt
    }

    class IdempotencyRecord {
        -String id
        -String merchantId
        -String idempotencyKey
        -String requestHash
        -String status
        -Int? responseStatusCode
        -String? responseBody
        -DateTime expiresAt
        -DateTime createdAt
        +isMatch(hash: String): Boolean
        +complete(code: Int, body: String): Void
    }

    class WebhookEndpoint {
        -String id
        -String merchantId
        -String url
        -String secret
        -Boolean active
        -DateTime createdAt
        +generateSignature(payload: String): String
    }

    class WebhookDelivery {
        -String id
        -String endpointId
        -String eventType
        -String payload
        -Int statusCode
        -Boolean success
        -Int attempts
        -DateTime deliveredAt
    }

    Merchant "1" *-- "0..*" ApiKey: possui
    Merchant "1" *-- "0..*" Account: possui contas
    Account --> AccountType: classificada como
    Merchant "1" *-- "0..*" Charge: processa
    Charge --> PaymentMethod: tipo de pagamento
    Charge --> ChargeStatus: estado
    Charge "1" *-- "0..*" Refund: permite
    LedgerTransaction "1" *-- "2..*" LedgerEntry: composta por
    LedgerEntry "0..*" --> "1" Account: afeta
    LedgerTransaction --> TransactionType: categoria
    LedgerEntry --> EntryDirection: sentido contábil
    Merchant "1" *-- "0..*" WebhookEndpoint: configura
    WebhookEndpoint "1" *-- "0..*" WebhookDelivery: dispara
    Merchant "1" *-- "0..*" IdempotencyRecord: escopo
```

---

## 🔄 2. Diagramas de Máquinas de Estado (Statecharts)

### 2.1 Ciclo de Vida da Cobrança (`Charge`)

```mermaid
stateDiagram-v2
    [*] --> PENDING: Iniciar Cobrança (Pix / Boleto / Cartão 2-step)
    [*] --> AUTHORIZED: Autorizar Cartão (sem captura imediata)
    [*] --> PAID: Cobrança Cartão (Autorização + Captura Direta)

    PENDING --> PAID: Confirmação de Pagamento [Pix recebido / Boleto compensado]
    PENDING --> FAILED: Expiração do Prazo / Erro de Pagador

    AUTHORIZED --> PAID: Captura Manual / Automática [Gera Ledger Posting]
    AUTHORIZED --> FAILED: Cancelamento da Pré-Autorização

    PAID --> REFUNDED: Estorno Aprovado [Gera Reversal Posting no Ledger]

    FAILED --> [*]: Arquivado
    REFUNDED --> [*]: Ciclo Concluído com Reversão Contábil
```

### 2.2 Ciclo de Vida do Registro de Idempotência (`IdempotencyRecord`)

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS: Primeira Requisição [Adquire Lock e Grava RequestHash]

    IN_PROGRESS --> COMPLETED: Transação Finalizada com Sucesso [Grava Status Code + Response JSON]
    IN_PROGRESS --> FAILED: Erro Fatal Não-Recuperável [Libera Lock para Retentativa]

    COMPLETED --> [*]: Expiração após 24 Horas
```

---

## ⚡ 3. Diagrama de Sequência de Sistema (SSD — Captura e Ledger Atômico)

```mermaid
sequenceDiagram
    autonumber
    actor M as 💻 Merchant API
    participant API as 🌐 Fastify Controller
    participant Idemp as 🛡️ Idempotency Middleware
    participant PaySvc as 💳 Payment Service
    participant LedgSvc as ⚖️ Ledger Engine
    participant DB as 💾 PostgreSQL (Transação ACID)
    participant HookSvc as 📬 Webhook Dispatcher

    M->>API: POST /api/v1/charges (Header: Idempotency-Key: k_123, Body: {amount: 10000, ...})
    API->>Idemp: processKey(merchantId, "k_123", requestHash)
    
    alt Chave Concluída em Cache (Cache Hit)
        Idemp-->>API: Cached Response (HTTP 201)
        API-->>M: HTTP 201 Created (X-Cache-Lookup: HIT)
    else Chave Inexistente (Primeiro Acesso)
        Idemp->>DB: INSERT INTO idempotency_records (status: 'IN_PROGRESS')
        Idemp-->>API: Lock Adquirido com Sucesso
        
        API->>PaySvc: createAndCaptureCharge(chargeDTO)
        PaySvc->>DB: BEGIN TRANSACTION (ISOLATION LEVEL SERIALIZABLE)
        
        PaySvc->>PaySvc: Valida Cartão & Cria Entidade Charge (status: PAID)
        PaySvc->>DB: INSERT INTO charges (...)
        
        PaySvc->>LedgSvc: postPaymentSettlement(charge, feeCents: 250)
        
        Note over LedgSvc: Monta Partidas Dobradas:<br/>DEBIT: Clearing Account (+10000 cents)<br/>CREDIT: Merchant Wallet (+9750 cents)<br/>CREDIT: Platform Fee (+250 cents)
        
        LedgSvc->>LedgSvc: assert(Debits == Credits) -> 10000 == 10000 (RN-001)
        
        LedgSvc->>DB: INSERT INTO ledger_transactions (...)
        LedgSvc->>DB: INSERT INTO ledger_entries (...) (Append-Only)
        LedgSvc->>DB: UPDATE accounts SET current_balance_in_cents = current_balance_in_cents + ...
        
        PaySvc->>DB: COMMIT TRANSACTION
        
        PaySvc->>Idemp: markComplete(code: 201, responseBody)
        Idemp->>DB: UPDATE idempotency_records SET status='COMPLETED', ...
        
        PaySvc->>HookSvc: dispatchEventAsync("payment.paid", chargePayload)
        
        PaySvc-->>API: ChargeResponseDTO (com Ledger Reference)
        API-->>M: HTTP 201 Created { id: "ch_xxx", status: "PAID", ledger_tx_id: "tx_xxx" }
    end
```
