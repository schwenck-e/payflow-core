# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-46] [Backend] Implementar Motor de Double-Entry Ledger Imutável

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** O núcleo financeiro do PayFlow Core exige precisão contábil matemática absoluta. É mandatório implementar o motor de partidas dobradas onde todo fluxo financeiro gera lançamentos balanceados de débito e crédito, garantindo auditabilidade e proibindo divergências financeiras.
- **Valor entregue:** Enforça o invariante contábil fundamental $\sum D = \sum C$ (RN-001), garante a imutabilidade estrita append-only dos registros contábeis (RN-002), protege carteiras de merchant contra saldo negativo indevido (RN-004) e assegura consistência monetária (RN-006). Atende aos requisitos RF-006, RF-008, RF-009, RF-010, RNF-001, RNF-002 e RNF-004.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/domain/entities/ledger-transaction.entity.ts` (Implementar validação matemática `validateAccountingInvariant` garantindo $\sum D == \sum C$)
  - `src/domain/entities/account.entity.ts` (Implementar `calculateNewBalance` e proteção de saldo negativo para contas LIABILITY/ASSET conforme regras de plano de contas)
  - `src/domain/services/ledger.service.ts` (Implementar métodos `postTransaction`, `getAccountBalance` e `getAccountStatement` com atomicidade ACID via `prisma.$transaction`)
- **Novos Arquivos a Criar:**
  - `tests/unit/ledger-double-entry.test.ts` (Testes unitários cobrindo balanceamento contábil e rejeição de transações desbalanceadas)
  - `tests/unit/account.entity.test.ts` (Testes unitários cobrindo cálculo de saldo por tipo de conta e validação de cheque especial)
- **Padrões de Referência no Repositório:**
  - `src/domain/errors/domain.errors.ts` (Utilizar `UnbalancedTransactionError`, `NegativeBalanceNotAllowedError`, `AccountNotFoundError`).
  - Diretrizes da ADR-001 em `thoughts/shared/architecture/adr/ADR-001-double-entry-immutable-ledger.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Qualquer transação contábil onde $\sum \text{amount}(\text{DEBIT}) \neq \sum \text{amount}(\text{CREDIT})$ é rejeitada imediatamente com `UnbalancedTransactionError` (RN-001).
- [ ] Tentativa de débito em conta sem permissão de cheque especial (`allowOverdraft: false`) que resulte em saldo negativo é rejeitada com `NegativeBalanceNotAllowedError` (RN-004).
- [ ] Operação `postTransaction` persiste a transação e todas as suas entradas de forma atômica no banco de dados via transação ACID (`prisma.$transaction`), sem executar queries UPDATE/DELETE sobre `LedgerEntry` (RN-002).
- [ ] Métodos de consulta de saldo (`getAccountBalance`) e extrato paginado (`getAccountStatement`) retornam dados precisos calculados.
- [ ] Testes unitários em `tests/unit/ledger-double-entry.test.ts` e `tests/unit/account.entity.test.ts` executam com 100% de sucesso via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-48, ENG-49, ENG-51, ENG-55
- **Bloqueado por:** ENG-45

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-46-double-entry-ledger`
- **Comando de Fechamento:** `Fixes ENG-46`
