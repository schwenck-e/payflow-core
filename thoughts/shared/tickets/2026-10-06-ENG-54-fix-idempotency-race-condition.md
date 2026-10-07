# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-54] [Backend] Corrigir Condição de Corrida no Motor de Idempotência Determinística

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** A regra de negócio RN-003 exige que duas requisições concorrentes com a mesma `Idempotency-Key` não sejam executadas em paralelo e jamais gerem processamentos duplicados. Na implementação atual do `IdempotencyService`, existe uma verificação não atômica dividida em duas etapas (`findUnique` seguido de `upsert`), gerando uma janela de corrida (*Time-of-Check to Time-of-Use - TOCTOU*). Além disso, o comando `upsert` na cláusula `update` sobrescreve cegamente registros que já poderiam estar em `COMPLETED` ou `IN_PROGRESS` com um novo status `IN_PROGRESS`, possibilitando que chamadas simultâneas contornem o bloqueio transitório.
- **Valor entregue:** Elimina a vulnerabilidade de condição de corrida através de aquisição de lock atômica no banco de dados (inserção atômica direta capturando erro de unicidade P2002 do Prisma ou transação serializável), assegurando que exatamente uma requisição execute e as concorrentes recebam `HTTP 409 Conflict` ou a resposta em cache conforme a RN-003.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/domain/services/idempotency.service.ts` (Refatorar linhas 28 a 93 do método `executeWithIdempotency` para substituir o fluxo de `findUnique` + `upsert` por tentativa atômica de criação de lock ou transação com tratamento seguro de conflito de chave única)
- **Novos Arquivos a Criar:**
  - `tests/integration/idempotency-concurrency.test.ts` (Teste automatizado de concorrência com disparos simultâneos via `Promise.all` para a mesma chave de idempotência)
- **Padrões de Referência no Repositório:**
  - `src/domain/entities/idempotency.entity.ts` (`validatePayloadMatch`)
  - `src/domain/errors/domain.errors.ts` (`IdempotencyConflictError`, `IdempotencyPayloadMismatchError`)
  - `tests/unit/idempotency.service.test.ts`

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] A aquisição de lock em `executeWithIdempotency` é atômica: tentativas simultâneas de registrar a mesma chave falham na restrição única `merchantId_idempotencyKey` e são imediatamente tratadas sem sobrescrever registros concluídos.
- [ ] Duas ou mais requisições concorrentes idênticas submetidas simultaneamente no mesmo milissegundo resultam em apenas 1 execução do handler de negócio; as demais recebem `IdempotencyConflictError` (HTTP 409) enquanto estiver em voo ou a resposta em cache após conclusão.
- [ ] Teste de integração de concorrência adicionado em `tests/integration/idempotency-concurrency.test.ts` disparando múltiplas requisições paralelas via `Promise.all` e passando com 100% de sucesso.
- [ ] Testes unitários preexistentes em `tests/unit/idempotency.service.test.ts` continuam passando sem regressão.
- [ ] Verificações de linters e types passam (`bun run typecheck`, `bun run check-arch`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-52, ENG-53
- **Bloqueado por:** ENG-47

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-54-fix-idempotency-race-condition`
- **Comando de Fechamento:** `Fixes ENG-54`
