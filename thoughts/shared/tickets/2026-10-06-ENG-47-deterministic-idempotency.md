# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-47] [Backend] Desenvolver Motor de Idempotência Determinística

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** Em sistemas de pagamentos e liquidação financeira, falhas transitórias de rede frequentemente causam reenvio automático de requisições pelos clientes. Para evitar cobranças duplicadas (*double-charge*) e assegurar consistência das operações, é imperativo implementar um motor determinístico de idempotência acionado pelo cabeçalho HTTP `Idempotency-Key`.
- **Valor entregue:** Garante que requisições repetidas idênticas retornem a resposta original em cache (`isCached: true`) sem reprocessamento financeiro, e detecta colisões maliciosas ou acidentais onde a mesma chave é utilizada para payloads distintos, abortando a chamada com conflito (RN-003). Atende aos requisitos RF-002 e RNF-003.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/infrastructure/security/hash.ts` (Implementar `canonicalizeJson` e `sha256` para canonicalização e hashing determinístico de payloads)
  - `src/domain/entities/idempotency.entity.ts` (Implementar validação `validatePayloadMatch` comparando o hash armazenado com o hash recebido)
  - `src/domain/services/idempotency.service.ts` (Implementar `executeWithIdempotency` gerenciando ciclo de vida dos status `IN_PROGRESS`, `COMPLETED` e `FAILED`)
- **Novos Arquivos a Criar:**
  - `tests/unit/idempotency.service.test.ts` (Testes cobrindo cache hit, bloqueio de requisição simultânea e payload mismatch)
- **Padrões de Referência no Repositório:**
  - `src/domain/errors/domain.errors.ts` (`IdempotencyConflictError`, `IdempotencyPayloadMismatchError`).
  - Diretrizes da ADR-002 em `thoughts/shared/architecture/adr/ADR-002-deterministic-idempotency.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Requisições com a mesma `Idempotency-Key` e mesmo payload retornam o status HTTP e dados gravados do cache (`isCached: true`) sem reexecutar o `handler` subjacente.
- [ ] Requisição reutilizando uma `Idempotency-Key` já cadastrada com payload diferente lança `IdempotencyPayloadMismatchError` com código `IDEMPOTENCY_PAYLOAD_MISMATCH` (HTTP 409) (RN-003).
- [ ] Requisições simultâneas interceptadas enquanto o registro estiver no estado `IN_PROGRESS` lançam `IdempotencyConflictError` evitando execuções paralelas.
- [ ] Resposta com tipo `BigInt` é serializada de maneira segura para JSON sem quebra em runtime.
- [ ] Testes unitários em `tests/unit/idempotency.service.test.ts` executam com 100% de sucesso via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-48, ENG-49, ENG-51, ENG-54
- **Bloqueado por:** ENG-45

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-47-deterministic-idempotency`
- **Comando de Fechamento:** `Fixes ENG-47`
