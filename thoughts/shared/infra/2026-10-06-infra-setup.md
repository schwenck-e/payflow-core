# 🐳 DevOps & SRE: Especificação de Infraestrutura e Containerização

- **Projeto:** `payflow-core`
- **Data:** `2026-10-06`
- **Engenheiro Responsável:** `devops_sre`
- **Status:** Concluído e Validado ✅

---

## 1. Arquitetura de Containerização (Multi-Stage Dockerfile)

O `Dockerfile` implementa o padrão canônico multi-stage:
1. **Estágio `deps`:** Base `oven/bun:1-alpine`, instala `libc6-compat`, copia manifestos de dependência e executa `bun install --frozen-lockfile` e `prisma generate`.
2. **Estágio `builder`:** Executa a verificação estática (`typecheck`), o linter arquitetural (`check-arch`) e o empacotamento com `bun build`.
3. **Estágio `runner`:** Imagem final mínima com `dumb-init` (gerenciador de PID 1) e `curl` para health checks.
   - Execução com usuário sem privilégios: `USER appuser` (UID/GID 1001).
   - Healthcheck nativo em `/health/liveness` a cada 15s.

---

## 2. Orquestração Local (`docker-compose.yml`)

Provisionamento completo da stack financeira para desenvolvimento e homologação:
- **`app`:** Instância do PayFlow Core exposta na porta `3000`.
- **`postgres`:** PostgreSQL 16 com volume persistente `postgres_data` e healthcheck `pg_isready`.
- **`redis`:** Redis 7 com healthcheck `redis-cli ping` para suporte a locks distribuídos.
- **Rede Isolada:** `payflow-network` tipo bridge.
