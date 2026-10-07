# DevOps & SRE: Configuração de Infraestrutura e Containerização (/setup_infra)

Este comando aciona o **`devops_sre`** para analisar a stack tecnológica do projeto e gerar uma infraestrutura de containerização completa, segura e reproduzível (Dockerfile multi-stage, docker-compose.yml e .dockerignore).

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/setup_infra
```
*(ou especificando requisitos: `/setup_infra "PostgreSQL + Redis + Node.js" ou "/setup_infra Go + SQLite"`)*

---

## 🔍 O que o DevOps & SRE Agent Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa a Stack Tecnológica e os Requisitos:**
   - Inspeciona `package.json`, `go.mod`, arquivos de ambiente (`.env.example`) e portas de rede.
   - Identifica dependências de banco de dados, filas e serviços de cache.
2. **Gera o `Dockerfile` Multi-Stage de Produção:**
   - Baseado no template `thoughts/shared/templates/dockerfile_template.dockerfile`.
   - Separação rigorosa de estágios: `deps` (cache de dependências), `builder` (compilação) e `runner` (runtime mínimo Alpine ou Distroless).
   - Enforça execução com usuário sem privilégios (`USER appuser`) e processo init (`dumb-init`).
   - Configura healthcheck nativo com `/health/liveness`.
3. **Gera o `docker-compose.yml` para Desenvolvimento Local:**
   - Baseado no template `thoughts/shared/templates/docker_compose_template.yaml`.
   - Provisiona a aplicação, banco de dados (ex: PostgreSQL) e cache (ex: Redis).
   - Define volumes persistentes, health checks de dependência (`condition: service_healthy`) e rede isolada.
4. **Cria o `.dockerignore` Otimizado:**
   - Ignora `node_modules`, `.git`, `.env*`, `dist`, `coverage`, `.claude` e artefatos de build temporários.
5. **Gera a Configuração de Health Probes:**
   - Verifica ou cria endpoints de monitoramento (`/health/liveness` e `/health/readiness`) na aplicação.
6. **Valida a Sintaxe e Montagem:**
   - Testa a validação do Compose com `docker compose config` (quando Docker disponível) e documenta o relatório em `thoughts/shared/infra/YYYY-MM-DD-infra-setup.md`.
