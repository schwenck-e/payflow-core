# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-53] [DevOps] Configurar Containerização Multi-Stage e Pipeline CI/CD GitHub Actions

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** Para viabilizar a entrega contínua e a reprodutibilidade dos ambientes do PayFlow Core, é imprescindível containerizar a aplicação utilizando as melhores práticas de imagens multi-stage leves e seguras com Bun, além de automatizar os checks de qualidade através de uma pipeline de CI/CD no GitHub Actions que impeça regressões ou quebra de conformidade arquitetural.
- **Valor entregue:** Reduz a superfície de ataque da imagem Docker final, viabiliza o deploy local padronizado com Docker Compose, e garante que todo push e pull request execute automaticamente os testes, typecheck e auditoria arquitetural (Zero Drift). Atende aos requisitos RNF-007 e suporte à esteira automatizada.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `package.json` (Garantir scripts de build, typecheck, check-arch e start compatíveis com containers)
- **Novos Arquivos a Criar:**
  - `Dockerfile` (Build multi-stage com base `oven/bun:1.2-alpine`, separando estágio de dependências, build e runtime sem privilégios de root)
  - `docker-compose.yml` (Definição dos serviços `app`, mapeamento de portas, variáveis de ambiente e healthcheck probe)
  - `.github/workflows/ci.yml` (Workflow do GitHub Actions acionado em push e pull_request nas branches main e release)
  - `scripts/arch_lint.ts` (Linter estático que audita importações indevidas entre camadas de domínio, infraestrutura e apresentação)
  - `thoughts/shared/runbooks/2026-10-06-v1.0.0-release-runbook.md` (Runbook com procedimentos operacionais de deploy, rollback e smoke testing)
- **Padrões de Referência no Repositório:**
  - `thoughts/shared/architecture/2026-10-06-payflow-core-architecture.md`.
  - `thoughts/shared/architecture/audits/2026-10-06-architecture-audit.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] `Dockerfile` compila imagem executável multi-stage enxuta sem erros (`docker build -t payflow-core .`).
- [ ] `docker-compose up` inicializa o serviço e os probes `/health/liveness` e `/health/readiness` respondem status 200.
- [ ] Workflow `.github/workflows/ci.yml` inclui jobs de `typecheck`, `check-arch` e `test`.
- [ ] Script de validação arquitetural `bun run check-arch` executa com sucesso reportando Score 100/100 e 0 violações de dependência de camada.
- [ ] Runbook operacional criado e documentado com plano de rollback.

#### 4. Grafo de Dependências
- **Bloqueia:** Nenhuma (Habilita Release v1.0.0 / Gate 2)
- **Bloqueado por:** ENG-51, ENG-52

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-53-devops-docker-ci-cd`
- **Comando de Fechamento:** `Fixes ENG-53`
