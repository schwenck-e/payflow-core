# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-55] [QA] Implementar Testes Automatizados de Concorrência e Stress no Double-Entry Ledger

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** O Ledger Contábil processa centenas de lançamentos financeiros em cenários de alta volumetria. No método `postTransaction` de `LedgerService`, o saldo da conta (`currentBalanceCents`) é consultado (`findUnique`) e atualizado (`update`) dentro da transação Prisma. É mandatório criar uma bateria de testes automatizados de estresse e concorrência massiva para comprovar que nenhuma condição de corrida provoque atualizações perdidas (*lost updates*), violações do invariante contábil $\sum D = \sum C$ (RN-001) ou saldos negativos não autorizados (RN-004).
- **Valor entregue:** Comprova empiricamente a resiliência ACID do Ledger e a consistência dos saldos contábeis agregados frente a acessos simultâneos concorrentes na mesma conta merchant, assegurando conformidade com os requisitos RNF-001 e RNF-002 antes do Gate 2 de produção.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/domain/services/ledger.service.ts` (Linhas 50 a 108 no método `postTransaction`, validando comportamento sob disputa transacional)
- **Novos Arquivos a Criar:**
  - `tests/integration/ledger-concurrency.test.ts` (Suíte de testes de concorrência com cenários de alta disputa em contas contábeis compartilhadas)
- **Padrões de Referência no Repositório:**
  - `src/domain/entities/ledger-transaction.entity.ts` (Validação de partidas dobradas)
  - `src/domain/entities/account.entity.ts` (Regras de débito e crédito por tipo de conta)
  - `tests/unit/ledger-double-entry.test.ts` (Testes unitários de referência)

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Suíte executa no mínimo 20 transações contábeis simultâneas concorrendo sobre as mesmas contas (Clearing e Merchant Wallet) disparadas via `Promise.all`.
- [ ] Todas as transações registradas no banco de dados respeitam estritamente o invariante contábil: a soma de todos os débitos é igual à soma de todos os créditos em cada transação individual e no agregado global (RN-001).
- [ ] O saldo consolidado final da conta (`currentBalanceCents`) reflete com precisão matemática a soma de todas as transações persistidas sem *lost updates*.
- [ ] Tentativas simultâneas de débito que excedam o saldo total disponível respeitam a RN-004 e rejeitam operações excedentes mantendo o saldo nunca inferior a zero (para contas com `allowOverdraft: false`).
- [ ] Testes em `tests/integration/ledger-concurrency.test.ts` executam com 100% de aprovação via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-52, ENG-53
- **Bloqueado por:** ENG-46, ENG-48

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-55-ledger-concurrency-testing`
- **Comando de Fechamento:** `Fixes ENG-55`
