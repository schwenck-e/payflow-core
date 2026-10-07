# DevOps & SRE: Pipeline Contínua de Integração e Entrega (/setup_ci_cd)

Este comando aciona o **`devops_sre`** para estruturar a pipeline completa de CI/CD em `.github/workflows/ci.yml` com todos os gates de qualidade (linter arquitetural, typecheck, suíte de testes, auditoria SAST e build de container).

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/setup_ci_cd
```
*(ou especificando alvos: `/setup_ci_cd "GitHub Actions com GHCR e deploy automático em staging"`)*

---

## 🔍 O que o DevOps & SRE Agent Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa as Ferramentas e Scripts do Monorepo:**
   - Inspeciona o gerenciador de pacotes (`bun`, `npm`, `pnpm`), scripts de teste, typecheck e build.
   - Detecta alvos no `Makefile` (ex: `make check`, `make check-arch`).
2. **Gera a Pipeline de CI/CD (`.github/workflows/ci.yml`):**
   - Baseado no template canônico `thoughts/shared/templates/ci_cd_pipeline_template.yaml`.
   - **Quality Gate:** Executa validação de sintaxe, TypeScript typecheck e o linter arquitetural (`bun scripts/arch_lint.ts` / `make check-arch`) para garantir Zero Architectural Drift.
   - **Test Gate:** Executa suítes completas de testes unitários e de integração (`bun test`).
   - **Security Gate:** Roda auditoria de vulnerabilidades (`bun audit`) e varredura de segredos (TruffleHog).
   - **Build & Package:** Constrói a imagem Docker multi-stage com cache inteligente (`type=gha`) e publica no GitHub Container Registry (`ghcr.io`).
   - **Zero-Downtime Deployment:** Dispara o rollout automático condicional a tags de versão semântica (`v*.*.*`).
3. **Configura Concorrência e Caching:**
   - Implementa `cancel-in-progress` para evitar builds redundantes em novas atualizações na mesma branch.
4. **Documenta a Estratégia de CI/CD:**
   - Registra as variáveis secretas necessárias no GitHub (`SECRETS`) e o fluxo de aprovação de ambientes em `thoughts/shared/infra/YYYY-MM-DD-ci-cd-spec.md`.
