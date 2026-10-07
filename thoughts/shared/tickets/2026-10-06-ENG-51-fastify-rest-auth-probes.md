# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-51] [Backend] Expor Rotas REST Fastify com Autenticação e Probes de Saúde

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** O PayFlow Core precisa disponibilizar sua interface de entrada HTTP de alto desempenho sobre o framework Fastify 5. É fundamental assegurar a proteção de acesso através de autenticação via Bearer API Key do Merchant, validação estrita dos contratos de entrada com schemas Zod, interceptação de idempotência em rotas mutativas, padronização de respostas de erro (RFC 7807) e disponibilização de probes de orquestração cloud-native (`/health/liveness` e `/health/readiness`).
- **Valor entregue:** Entrega a camada de apresentação HTTP segura, protegendo recursos contra acesso não autorizado (RF-001, OWASP A01), habilitando probes de monitoramento de integridade para Kubernetes/Docker (RF-012, RNF-007) e garantindo conformidade com a especificação OpenAPI. Atende aos requisitos RF-001, RF-010, RF-012, RNF-006 e RNF-007.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/presentation/middlewares/auth.middleware.ts` (Implementar autenticação Bearer token com hash SHA-256 e validação de status ativo do merchant)
  - `src/presentation/controllers/charge.controller.ts` (Implementar endpoints `POST /api/v1/charges` e `POST /api/v1/charges/:id/refund` integrados ao `IdempotencyService` e `PaymentService`)
  - `src/presentation/controllers/ledger.controller.ts` (Implementar endpoints de consulta de contas contábeis `GET /api/v1/accounts`, `GET /api/v1/accounts/:id/balance` e `POST /api/v1/ledger/transactions`)
  - `src/presentation/controllers/health.controller.ts` (Implementar endpoints `/health/liveness` e `/health/readiness` com checagem de conectividade do banco de dados)
  - `src/presentation/app.ts` (Montagem do Fastify, registro de rotas, plugins Zod e handler global de erros RFC 7807)
  - `src/index.ts` (Inicialização do servidor na porta configurada)
- **Novos Arquivos a Criar:**
  - `tests/integration/health.test.ts` (Testes cobrindo probes de liveness e readiness)
- **Padrões de Referência no Repositório:**
  - Contrato OpenAPI em `thoughts/shared/contracts/openapi.yaml`.
  - Tratamento global de erros em `src/domain/errors/domain.errors.ts`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Requisições às rotas de negócio sem header `Authorization: Bearer <key>` ou com chave inválida/revogada retornam `HTTP 401 Unauthorized` (RF-001).
- [ ] Rotas mutativas de pagamento exigem o cabeçalho `Idempotency-Key` e retornam `HTTP 400 Bad Request` na sua ausência.
- [ ] Endpoint `/health/liveness` retorna `HTTP 200 OK` com `{"status":"ok"}`.
- [ ] Endpoint `/health/readiness` verifica a conexão com o banco de dados via Prisma e retorna `HTTP 200 OK` quando saudável (RF-012).
- [ ] Erros de validação Zod e exceções de domínio retornam formato RFC 7807 Problem Details (`application/problem+json`) contendo `type`, `title`, `status` e `detail`.
- [ ] Testes de integração em `tests/integration/health.test.ts` e `payment-flow.test.ts` passam com 100% de sucesso via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-52, ENG-53
- **Bloqueado por:** ENG-45, ENG-46, ENG-47, ENG-48, ENG-49, ENG-50

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-51-fastify-rest-auth-probes`
- **Comando de Fechamento:** `Fixes ENG-51`
