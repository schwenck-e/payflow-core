# 🛡️ Relatório de Auditoria de Segurança de Aplicação (AppSec & SAST)

- **Projeto / Repositório:** `payflow-core`
- **Data da Auditoria:** `2026-10-06`
- **Auditor Responsável:** `qa_engineer` (Principal QA & AppSec Engineer)
- **Status da Liberação:** `APROVADO COM RESSALVAS` ⚠️ (Gating: Correção mandatória de BOLA/IDOR antes de expor externamente)
- **Vulnerabilidades Críticas:** `0` | **Altas:** `2` | **Médias:** `2` | **Baixas:** `0` | **SCA Dev:** `1`

---

## 1. Sumário Executivo de Segurança

A auditoria de segurança da informação e análise estática (SAST / SCA) foi executada diretamente sobre a base de código do **PayFlow Core** em ambiente macOS com Bun runtime v1.3.14.

### Destaques Positivos de Arquitetura Segura (*Security by Design*):
1. **Zero SQL Injection (OWASP A03):** 100% das operações de banco de dados utilizam Prisma ORM tipado e transações ACID (`prisma.$transaction`). Não há ocorrências de `$queryRawUnsafe` ou interpolação de strings.
2. **Invariante Contábil e Concorrência (OWASP A04):** O Ledger de partidas dobradas garante rigorosamente `Sum(Debits) == Sum(Credits)` (RN-001) e proteção contra overdraft (RN-004). O ordenamento determinístico por `accountId` mitiga deadlocks em transferências concorrentes simultâneas.
3. **Idempotência Atômica (RN-003):** O mecanismo de chave de idempotência utiliza trava atômica a nível de banco via constraint única `[merchant_id, idempotency_key]`, cálculo canônico SHA-256 e detecção de payload mismatch com resposta `409 Conflict`.
4. **Validação Estrita de Schemas (OWASP A08):** Schemas Zod cobrem 100% dos payloads HTTP nos controllers.

### Vulnerabilidades Identificadas que Requerem Correção:
1. **Broken Object Level Authorization (BOLA / IDOR - OWASP A01):** Endpoints `GET /api/v1/charges/:id`, `POST /api/v1/charges/:id/refund` e `GET /api/v1/accounts/:id/balance` não validam a posse do tenant (`merchantId`) contra o merchant autenticado na requisição (`req.merchant.id`).
2. **Timing Attack em Verificação Criptográfica (OWASP A02):** `SecurityService.verifyHmacSignature` compara assinaturas usando igualdade de string padrão (`===`), expondo a chave a timing attacks (CWE-208), contrariando a recomendação de `crypto.timingSafeEqual`.
3. **Configuração de Headers de Segurança (OWASP A05):** Ausência de middleware de Security Headers (`@fastify/helmet` ou headers como `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).

---

## 2. Checklist de Conformidade OWASP Top 10

| Item OWASP | Status | Observações / Evidências no Código |
| :--- | :---: | :--- |
| **A01: Broken Access Control** | ⚠️ NÃO CONFORME | `GET /charges/:id`, `POST /charges/:id/refund` e `GET /accounts/:id/balance` permitem leitura/operação cruzada entre merchants (BOLA / IDOR). |
| **A02: Cryptographic Failures** | ⚠️ NÃO CONFORME | HMAC verificado com `===` ao invés de `crypto.timingSafeEqual` em `src/infrastructure/security/hash.ts:23`. API Key usa SHA-256 simples sem salt configurado no schema. |
| **A03: Injection** | ✅ CONFORME | Prisma ORM tipado em 100% das mutações e queries. Zero ocorrências de `$queryRawUnsafe` ou queries raw. |
| **A04: Insecure Design** | ✅ CONFORME | Idempotência atômica com lock via constraint P2002; ordenação de contas para prevenção de deadlock; integridade contábil estrita (RN-001/RN-004). |
| **A05: Security Misconfiguration** | ⚠️ NÃO CONFORME | Servidor Fastify não registra `@fastify/helmet` nem headers HSTS/nosniff/frame-options. Rate limiting não configurado no app. |
| **A06: Vulnerable Components** | ⚠️ RESSALVA (DEV) | `deepmerge-ts <8.0.0` (Stack exhaustion DoS GHSA-ggr8-5vv4-36mx) em `@prisma/config` (dependência de desenvolvimento do Prisma CLI). Runtime limpo. |
| **A07: Identification & Auth Failures** | ✅ CONFORME | Middleware Bearer API Key valida status ativo do merchant e flag `revoked`. Chave nunca é logada em texto puro. |
| **A08: Software & Data Integrity** | ✅ CONFORME | Schemas Zod validam rigorosamente todas as entradas nos controllers antes de qualquer camada de serviço ou domínio. |
| **A09: Security Logging & Monitoring** | ✅ CONFORME | Dados sensíveis de cartão (PAN completo, CVV) não são persistidos nem logados. Probes `/health/liveness` e `/health/readiness` ativos. |
| **A10: Server-Side Request Forgery** | ℹ️ ALERTA | Webhooks despachados a partir de URLs cadastradas sem validação de whitelist de IP privado (127.0.0.1, 169.254.169.254, RFC 1918). |

---

## 3. Matriz de Vulnerabilidades Encontradas

### 🔴 ALTA: BOLA / IDOR em Consulta e Reembolso de Cobranças
- **Arquivo / Linha:** [`src/presentation/controllers/charge.controller.ts`](file:///Users/egsl/Documents/projects/payflow-core/src/presentation/controllers/charge.controller.ts#L160-L167)
- **Classificação:** CWE-639 / OWASP A01: Broken Access Control
- **Vetor de Ataque:** Um Merchant B autenticado pode realizar `GET /api/v1/charges/:id` passando o UUID de uma cobrança gerada pelo Merchant A, obtendo dados de clientes (PII) e detalhes financeiros.
- **Evidência de Código:**
```typescript
// charge.controller.ts:160
const charge = await prisma.charge.findUnique({
  where: { id },
  include: { refunds: true },
});
if (!charge) {
  throw new ChargeNotFoundError(id);
}
// Ausência de verificação: if (charge.merchantId !== req.merchant!.id) throw new ForbiddenError();
```
- **Ação de Remediação:**
Restringir a consulta com `where: { id, merchantId: req.merchant!.id }` ou disparar `403 Forbidden` / `404 Not Found` caso o `charge.merchantId` divirja do tenant autenticado.

---

### 🔴 ALTA: BOLA / IDOR em Balanço e Extrato de Contas Contábeis
- **Arquivo / Linha:** [`src/presentation/controllers/ledger.controller.ts`](file:///Users/egsl/Documents/projects/payflow-core/src/presentation/controllers/ledger.controller.ts#L70-L95)
- **Classificação:** CWE-639 / OWASP A01: Broken Access Control
- **Vetor de Ataque:** Qualquer Merchant autenticado pode ler saldo e extrato financeiro de contas de terceiros (`/accounts/:id/balance` e `/accounts/:id/statement`), expondo volumes de transações e saldo em custódia.
- **Evidência de Código:**
```typescript
// ledger.controller.ts:70
app.get("/accounts/:id/balance", async (req, reply) => {
  const { id } = req.params as { id: string };
  const account = await ledgerService.getAccountBalance(id);
  // Ausência de validação de tenant
```
- **Ação de Remediação:**
Validar se `account.merchantId === req.merchant!.id` (ou se o usuário possui role de administrador da plataforma).

---

### 🟠 MÉDIA: Timing Attack em Verificação de Assinatura HMAC (CWE-208)
- **Arquivo / Linha:** [`src/infrastructure/security/hash.ts`](file:///Users/egsl/Documents/projects/payflow-core/src/infrastructure/security/hash.ts#L21-L24)
- **Classificação:** CWE-208 / OWASP A02: Cryptographic Failures
- **Vetor de Ataque:** O método `verifyHmacSignature` utiliza o operador `===` para comparar a assinatura calculada com a esperada, retornando precocemente no primeiro caractere incorreto. Isso permite mensuração estatística de latência (Side-Channel Timing Attack) para forjar assinaturas de webhooks.
- **Evidência de Código:**
```typescript
// src/infrastructure/security/hash.ts:21-24
public static verifyHmacSignature(payload: string, secret: string, expectedSignature: string): boolean {
  const computedSignature = this.generateHmacSignature(payload, secret);
  return computedSignature === expectedSignature; // <-- timing leak
}
```
- **Ação de Remediação:**
Utilizar `crypto.timingSafeEqual` com buffers de tamanho equivalente:
```typescript
import { timingSafeEqual } from "crypto";

public static verifyHmacSignature(payload: string, secret: string, expectedSignature: string): boolean {
  const computedSignature = this.generateHmacSignature(payload, secret);
  const bufA = Buffer.from(computedSignature, "utf-8");
  const bufB = Buffer.from(expectedSignature, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
```

---

### 🟠 MÉDIA: Ausência de Security Headers HTTP
- **Arquivo / Linha:** [`src/presentation/app.ts`](file:///Users/egsl/Documents/projects/payflow-core/src/presentation/app.ts#L8-L12)
- **Classificação:** CWE-693 / OWASP A05: Security Misconfiguration
- **Vetor de Ataque:** Ausência de headers defensivos (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`), permitindo clickjacking ou MIME-sniffing em clientes web consumindo a API.
- **Ação de Remediação:**
Adicionar `@fastify/helmet` no bootstrap do Fastify ou hook com headers de segurança padrão.

---

## 4. Auditoria de Dependências de Terceiros (SCA / CVEs)

- **Comando Executado:** `npm audit`
- **Total de Pacotes Escaneados:** 90 dependências
- **Resultado:** 3 vulnerabilidades de severidade Alta identificadas na árvore do Prisma CLI (ferramenta de desenvolvimento).

### 🖥️ Evidência Real de Terminal - `npm audit`:
```text
# npm audit report

deepmerge-ts  <8.0.0
Severity: high
DeepmergeTS has stack exhaustion when merging recursive object graphs - https://github.com/advisories/GHSA-ggr8-5vv4-36mx
fix available via `npm audit fix`
node_modules/deepmerge-ts
  @prisma/config  6.13.0-dev.1 - 8.1.0-dev.4
  Depends on vulnerable versions of deepmerge-ts
  node_modules/@prisma/config
    prisma  6.13.0-dev.1 - 8.1.0-dev.4
    Depends on vulnerable versions of @prisma/config
    node_modules/prisma

3 high severity vulnerabilities

To address all issues, run:
  npm audit fix
```

*Nota AppSec:* O pacote `deepmerge-ts` é consumido exclusivamente pelo binário de build/CLI `@prisma/config` em tempo de desenvolvimento, não sendo exposto diretamente em tempo de execução HTTP no bundle de produção.

---

## 5. Auditoria de Conformidade Arquitetural (`check-arch`)

### 🖥️ Evidência Real de Terminal - `bun run check-arch`:
```text
$ bun run scripts/arch_lint.ts
🏛️ [ArchLint] Executando Auditoria de Conformidade Arquitetural...
✅ [ArchLint] Zero Architectural Drift confirmado! Score: 100/100 (APROVADO)
```

---

## 6. Scanner SAST Automatizado em Código Fonte (`src/`)

### 🖥️ Evidência Real de Terminal - `bun run scripts/sast_scan.ts`:
```text
================================================================================
🔒 PAYFLOW-CORE SAST AUDIT SCANNER (Static Application Security Testing)
================================================================================
Scanning target: src/ ...
Scan concluído. Total de arquivos inspecionados: 18
Total de apontamentos encontrados: 4

🟠 [MEDIUM] SEC-CRYPTO-001 - OWASP A02: Cryptographic Failures
   Local: src/infrastructure/security/hash.ts:23
   Código: return computedSignature === expectedSignature;
   Detalhe: Comparação de assinatura HMAC usando '===' ao invés de crypto.timingSafeEqual (Vulnerável a Timing Attack CWE-208).

🟠 [MEDIUM] SEC-MISC-001 - OWASP A05: Security Misconfiguration
   Local: src/presentation/app.ts:8
   Código: export function buildApp(): FastifyInstance {
   Detalhe: Servidor Fastify sem registro de security headers (Helmet / HSTS / X-Content-Type-Options / X-Frame-Options).

🔴 [HIGH] SEC-BOLA-001 - OWASP A01: Broken Access Control
   Local: src/presentation/controllers/charge.controller.ts:161
   Código: where: { id },
   Detalhe: Consulta de entidade por ID sem filtrar ou validar tenant (merchantId). Risco de Broken Object Level Authorization (BOLA/IDOR).

🔴 [HIGH] SEC-BOLA-002 - OWASP A01: Broken Access Control
   Local: src/presentation/controllers/ledger.controller.ts:71
   Código: const account = await ledgerService.getAccountBalance(id);
   Detalhe: Consulta de saldo de conta sem verificação de posse do Merchant autenticado. Risco de IDOR.

--------------------------------------------------------------------------------
📊 RESUMO DO SCANNER SAST:
   🚨 Críticas: 0
   🔴 Altas:    2
   🟠 Médias:   2
   🟡 Baixas:   0
--------------------------------------------------------------------------------
```

---

## 7. Execução Integral da Suíte de Testes (`bun test`)

A suíte completa de testes automatizados unitários e de integração de concorrência foi executada para comprovar estabilidade, integridade do Ledger de partidas dobradas e resiliência contra race conditions de idempotência.

### 🖥️ Evidência Real de Terminal - `bun test`:
```text
bun test v1.3.14 (0d9b296a)

tests/unit/idempotency.service.test.ts:
✓ Idempotency Service (RN-003) > deve executar e gravar o resultado no primeiro acesso [246.73ms]
✓ Idempotency Service (RN-003) > deve retornar o resultado em cache com isCached=true em chamadas repetidas com mesmo payload (Replay) [15.08ms]
✓ Idempotency Service (RN-003) > deve lançar IdempotencyPayloadMismatchError se o payload for alterado na mesma chave (RN-003) [17.05ms]
prisma:error 
Invalid `prisma.idempotencyRecord.create()` invocation in
/Users/egsl/Documents/projects/payflow-core/src/domain/services/idempotency.service.ts:94:56

  91 const newRecordId = randomUUID();
  92 
  93 try {
→ 94   const created = await prisma.idempotencyRecord.create(
Unique constraint failed on the fields: (`merchant_id`,`idempotency_key`)
prisma:error 
Invalid `prisma.idempotencyRecord.create()` invocation in
/Users/egsl/Documents/projects/payflow-core/src/domain/services/idempotency.service.ts:94:56

  91 const newRecordId = randomUUID();
  92 
  93 try {
→ 94   const created = await prisma.idempotencyRecord.create(
Unique constraint failed on the fields: (`merchant_id`,`idempotency_key`)
prisma:error 
Invalid `prisma.idempotencyRecord.create()` invocation in
/Users/egsl/Documents/projects/payflow-core/src/domain/services/idempotency.service.ts:94:56

  91 const newRecordId = randomUUID();
  92 
  93 try {
→ 94   const created = await prisma.idempotencyRecord.create(
Unique constraint failed on the fields: (`merchant_id`,`idempotency_key`)
prisma:error 
Invalid `prisma.idempotencyRecord.create()` invocation in
/Users/egsl/Documents/projects/payflow-core/src/domain/services/idempotency.service.ts:94:56

  91 const newRecordId = randomUUID();
  92 
  93 try {
→ 94   const created = await prisma.idempotencyRecord.create(
Unique constraint failed on the fields: (`merchant_id`,`idempotency_key`)
✓ Idempotency Service (RN-003) > deve prevenir race condition em chamadas simultâneas com a mesma Idempotency-Key [71.81ms]
✓ Idempotency Service (RN-003) > deve permitir retry quando a execução prévia falha (status FAILED) [27.69ms]
✓ Idempotency Service (RN-003) > deve lançar IdempotencyPayloadMismatchError se o payload for alterado em retry de chave FAILED [13.35ms]

tests/unit/webhook.service.test.ts:
✓ Webhook Signature & HMAC-SHA256 > deve gerar e verificar assinatura HMAC-SHA256 consistente [0.95ms]

tests/unit/account.entity.test.ts:
✓ Account Entity & Accounting Balances > deve calcular impacto de Débito e Crédito em contas de Ativo (ASSET) [0.37ms]
✓ Account Entity & Accounting Balances > deve calcular impacto em contas de Passivo (LIABILITY / Wallet do Merchant) [0.08ms]
✓ Account Entity & Accounting Balances > deve lançar NegativeBalanceNotAllowedError se o saldo for ficar negativo e overdraft for desabilitado (RN-004) [0.22ms]

tests/unit/money.vo.test.ts:
✓ Money Value Object (Minor Units / Zero Floating Point) > deve criar valores monetários a partir de centavos inteiros [0.22ms]
✓ Money Value Object (Minor Units / Zero Floating Point) > deve criar valores a partir de string decimal com precisão exata [0.13ms]
✓ Money Value Object (Minor Units / Zero Floating Point) > deve somar e subtrair valores preservando centavos sem erros IEEE 754 [0.14ms]
✓ Money Value Object (Minor Units / Zero Floating Point) > deve lançar InvalidCurrencyError ao tentar somar moedas diferentes [0.14ms]
✓ Money Value Object (Minor Units / Zero Floating Point) > deve alocar centavos proporcionalmente sem perder centavos residuais [0.33ms]

tests/unit/ledger-double-entry.test.ts:
✓ Double-Entry Ledger Invariant (RN-001) > deve criar uma transação de partidas dobradas quando a soma dos débitos for exatamente igual à dos créditos [0.51ms]
✓ Double-Entry Ledger Invariant (RN-001) > deve lançar UnbalancedLedgerError se houver divergência de 1 centavo sequer entre débitos e créditos (RN-001) [0.19ms]

tests/integration/payment-flow.test.ts:
✓ Payment Flow Integration (Fastify + Ledger) > deve criar e capturar uma cobrança de Cartão e liquidar no Ledger automaticamente [184.99ms]
✓ Payment Flow Integration (Fastify + Ledger) > deve criar uma cobrança Pix com status PENDING e payload EMV válido [17.03ms]

tests/integration/ledger-concurrency.test.ts:
✓ Ledger Concurrency & Deadlock Prevention (RN-001 & RN-004) > deve executar transferências cruzadas simultâneas sem deadlock (ordenação por accountId) [53.84ms]
✓ Ledger Concurrency & Deadlock Prevention (RN-001 & RN-004) > deve impedir saldo negativo em contas protegidas (RN-004) mantendo atomicidade [12.19ms]

tests/integration/refund-flow.test.ts:
✓ Refund Flow & Ledger Reversal Integration (RN-005) > deve realizar estorno parcial com lançamento contábil reverso e impedir estorno acima do saldo (RN-005) [100.39ms]

tests/integration/health.test.ts:
✓ Health Probes Integration > GET /health/liveness deve responder 200 OK com status=ok [1.45ms]
✓ Health Probes Integration > GET /health/readiness deve responder 200 OK com database=connected [9.43ms]

 24 pass
 0 fail
 78 expect() calls
Ran 24 tests across 9 files. [3.78s]
```

---

## 8. Parecer Final e Recomendações

O **PayFlow Core** possui um núcleo financeiro de excelência em concorrência, consistência transacional e modelagem contábil de partidas dobradas (zero falhas em 24 testes, 100/100 em integridade arquitetural).

Contudo, sob a ótica de **Application Security**, a liberação direta para consumo por terceiros sem a remediação das falhas de autorização de objetos (BOLA/IDOR) e ajuste na verificação de HMAC representaria um risco severo de vazamento e manipulação de dados entre merchants.

### Plano de Ação Recomendado para Go-Live (Prioridade Imediata):
1. **[P0] Corrigir BOLA/IDOR:**
   - Adicionar cláusula `merchantId: req.merchant!.id` nas consultas de `GET /charges/:id`, `POST /charges/:id/refund`, `GET /accounts/:id/balance` e `GET /accounts/:id/statement`.
2. **[P1] Mitigar Timing Attack em HMAC:**
   - Substituir `===` por `crypto.timingSafeEqual` em `src/infrastructure/security/hash.ts`.
3. **[P2] Adicionar Security Headers:**
   - Registrar `@fastify/helmet` ou injetar headers obrigatórios via hook global Fastify.
4. **[P2] Atualizar Prisma CLI:**
   - Rodar `bun update prisma @prisma/client` assim que a versão estável com `deepmerge-ts >= 8.0.0` estiver publicada.

> **Parecer de Liberação:** **APROVADO COM RESSALVAS** (Apto para ambientes de Staging/Testes; bloqueado para tráfego externo multitenant até o fechamento dos itens P0 e P1).
