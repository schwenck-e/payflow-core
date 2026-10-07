# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-49] [Backend] Implementar Estorno de Cobrança com Lançamentos Contábeis Reversos

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** Em operações financeiras, disputas comerciais, cancelamentos ou devoluções de mercadorias exigem estornos parciais ou totais de transações. O PayFlow Core precisa suportar reembolsos de cobranças previamente pagas mantendo a estrita integridade contábil do Ledger, onde lançamentos originais jamais são apagados (imutabilidade, RN-002), mas sim compensados por lançamentos contábeis reversos balanceados.
- **Valor entregue:** Enforça o limite acumulado de estornos impedindo que devoluções ultrapassem o valor original da cobrança (RN-005), além de criar a transação de reversão no Ledger compensando débito na conta do merchant e crédito na conta clearing da plataforma (RN-001, RN-002). Atende aos requisitos RF-007 e RN-005.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/domain/entities/charge.entity.ts` (Implementar métodos `canRefund`, `calculateRemainingRefundableAmount` e atualização de status para PARTIALLY_REFUNDED ou REFUNDED)
  - `src/domain/services/payment.service.ts` (Implementar método `refundCharge` orquestrando checagem de limite, criação do registro de Refund e postagem contábil reversa no `LedgerService`)
- **Novos Arquivos a Criar:**
  - `tests/integration/refund-flow.test.ts` (Testes integrados de estorno parcial sucessivo, estorno total e bloqueio de estorno que excede o valor disponível)
- **Padrões de Referência no Repositório:**
  - `src/domain/services/ledger.service.ts` (Método `postTransaction` com tipo `TransactionType.REFUND`).
  - `src/domain/errors/domain.errors.ts` (Utilizar `RefundExceedsChargeError`, `ChargeNotEligibleForRefundError`, `ChargeNotFoundError`).
  - Caso de uso formal UC-004 em `thoughts/shared/analysis/use_cases/2026-10-06-core-use-cases.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Cobrança com status diferente de `PAID` ou `PARTIALLY_REFUNDED` rejeita solicitação de reembolso com `ChargeNotEligibleForRefundError`.
- [ ] Tentativa de estorno cujo valor somado aos estornos anteriores exceda o montante original da cobrança (`total_refunded > amount`) é bloqueada com `RefundExceedsChargeError` (RN-005).
- [ ] Todo estorno bem-sucedido cria um registro na tabela `Refund` e gera uma transação de reversão no Ledger debitando a carteira do merchant e creditando a conta de clearing com valor idêntico ($\sum D = \sum C$, RN-001, RN-002, RF-007).
- [ ] O status da cobrança transita para `PARTIALLY_REFUNDED` se houver saldo residual ou `REFUNDED` se 100% do valor for devolvido.
- [ ] Testes de integração em `tests/integration/refund-flow.test.ts` executam com 100% de sucesso via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-51, ENG-52
- **Bloqueado por:** ENG-46, ENG-48

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-49-charge-refund-reversals`
- **Comando de Fechamento:** `Fixes ENG-49`
