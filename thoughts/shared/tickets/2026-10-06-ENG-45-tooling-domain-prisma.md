# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-45] [Backend] Configurar Tooling, Modelagem de Domínio e Schema Prisma

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** Estabelecer a base arquitetural e estrutural do PayFlow Core no runtime Bun com TypeScript strict mode, configurando o Prisma ORM e modelando as entidades centrais do Bounded Context financeiro (Merchants, Contas Contábeis, Transações de Ledger, Cobranças, Reembolsos e Idempotência).
- **Valor entregue:** Viabiliza a persistência relacional tipada e garante as bases para as regras de negócio de partidas dobradas (RN-001), imutabilidade contábil (RN-002) e manipulação monetária segura em unidades inteiras menores (Minor Units / centavos, RNF-005). Atende aos requisitos RF-001, RF-008 e RNF-005.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `package.json` (Scripts de build, prisma, typecheck e dependências @prisma/client, fastify, zod)
  - `tsconfig.json` (Configuração do compilador TypeScript com strict mode ativado)
- **Novos Arquivos a Criar:**
  - `prisma/schema.prisma` (Modelos Merchant, ApiKey, Account, LedgerTransaction, LedgerEntry, Charge, Refund, IdempotencyRecord)
  - `src/infrastructure/database/prisma.ts` (Instanciação do PrismaClient singleton)
  - `src/infrastructure/database/seed.ts` (Seed de contas mestras: Clearing, Fees e Merchant de teste)
  - `src/domain/value-objects/money.vo.ts` (Value object Money garantindo aritmética com inteiros e proibição de float)
  - `src/domain/entities/account.entity.ts` (Entidade de conta contábil e plano de contas)
  - `src/domain/entities/charge.entity.ts` (Entidade de cobrança com estados e transições)
  - `src/domain/entities/idempotency.entity.ts` (Entidade de registro de idempotência)
  - `src/domain/entities/ledger-transaction.entity.ts` (Entidade de transação e entradas contábeis)
  - `src/domain/errors/domain.errors.ts` (Catálogo de exceções canônicas de domínio)
- **Padrões de Referência no Repositório:**
  - Seguir as diretrizes de Clean Architecture e DDD em `thoughts/shared/architecture/2026-10-06-payflow-core-architecture.md`.
  - Conformidade com a especificação de requisitos em `thoughts/shared/requirements/2026-10-06-srs-specification.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Schema Prisma (`prisma/schema.prisma`) compila e gera os tipos sem advertências via `bun run db:generate`.
- [ ] Migração inicial executada ou sincronizada com banco SQLite/Postgres via `bun run db:push`.
- [ ] Script de seed (`src/infrastructure/database/seed.ts`) popula com sucesso o Merchant padrão e as contas canônicas do sistema (`bun run db:seed`).
- [ ] Value Object `Money` implementa operações aritméticas seguras com `bigint` / centavos e testes passam em `tests/unit/money.vo.test.ts`.
- [ ] Verificações de linters e types passam sem erros (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-46, ENG-47, ENG-48, ENG-51
- **Bloqueado por:** Nenhuma

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-45-tooling-domain-prisma`
- **Comando de Fechamento:** `Fixes ENG-45`
