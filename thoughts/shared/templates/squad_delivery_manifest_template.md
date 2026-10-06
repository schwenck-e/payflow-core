# 🚀 Autonomous Squad Delivery Manifest

**Project / Initiative:** [e.g., Sistema de Gestão de Ordens de Serviço]  
**Linear Epic Reference:** [ENG-XX: Title]  
**Orchestrator:** [Squad Lead Agent]  
**Date Started:** [YYYY-MM-DD]  
**Overall Status:** [🟡 IN PROGRESS / 🟢 READY FOR RELEASE / ✅ DELIVERED]  

---

## 👥 1. Squad Roster & Roles

| Role | Specialist Agent | Model Engine | Mission Focus |
| :--- | :--- | :--- | :--- |
| **Squad Lead** | `squad_lead` | Claude Code / Antigravity | Orquestração da esteira e governança dos Approval Gates |
| **Systems Analyst** | `systems_analyst` | Claude Sonnet / Pro | TAP, SRS (RF/RNF/RN), UML 2.5 (Classes/UC), RTM e TEP/UAT |
| **Product Designer** | `product_designer` | Sonnet / Gemini Flash | Design system tokens, wireframes e jornadas de usuário |
| **System Architect** | `system_architect` | Claude Sonnet / Pro | Modelagem C4, ADRs canônicas, dimensionamento de carga |
| **Product Manager** | `product_manager` | Claude Sonnet | Decomposição técnica em tarefas verticais e sync Linear |
| **Software Engineers**| `implement_plan` / `ralph_impl` | Sonnet / Flash | Implementação orientada a testes em worktrees isoladas |
| **QA & AppSec** | `qa_engineer` | Sonnet / Gemini Flash | Pirâmide de testes (Vitest/Playwright) e OWASP Top 10 SAST |
| **DevOps & SRE** | `devops_sre` | Sonnet / Gemini Flash | Docker multi-stage, CI/CD GitHub Actions e Runbook |

---

## 🧭 2. End-to-End Delivery Pipeline Status

| # | Estágio da Esteira | Responsável | Comando Primário | Status | Evidência / Artefato |
| :-: | :--- | :--- | :--- | :-: | :--- |
| **0.1** | Termo de Abertura & Escopo In/Out | `systems_analyst` | `/project_charter` | ⏳ PENDENTE | `thoughts/shared/governance/TAP-*.md` |
| **0.2** | Elicitação de Requisitos (SRS) | `systems_analyst` | `/elicit_requirements` | ⏳ PENDENTE | `thoughts/shared/requirements/SRS-*.md` |
| **0.3** | Casos de Uso & Domínio UML 2.5 | `systems_analyst` | `/model_use_cases` & `/model_domain` | ⏳ PENDENTE | `thoughts/shared/analysis/` |
| **1** | Design Tokens & Wireframes | `product_designer` | `/design_system` & `/create_wireframe` | ⏳ PENDENTE | `thoughts/shared/design/` |
| **2** | Arquitetura C4, ADRs & FinOps | `system_architect` | `/architect_system` & `/create_adr` | ⏳ PENDENTE | `thoughts/shared/architecture/` |
| 🛡️ | **GATE 1: Concepção, Escopo & Arquitetura** | **Engenheiro Líder (Humano)** | `request_approval` (CodeLayer WUI) | ⏳ AGUARDANDO | Aprovação explícita no WUI |
| **3** | Fatiamento de Backlog & Matriz RTM | `product_manager` & `systems_analyst` | `/plan_project` & `/generate_rtm` | ⏳ PENDENTE | Tickets no Linear & `RTM-*.md` |
| **4** | Implementação em Worktrees | `Software Engineers` | `/implement_plan` | ⏳ PENDENTE | Commits semânticos no Git |
| **5** | Qualificação de Testes & QA | `qa_engineer` | `/generate_tests` | ⏳ PENDENTE | `thoughts/shared/qa/` |
| **6** | Auditoria de Segurança SAST | `qa_engineer` | `/security_audit` | ⏳ PENDENTE | Laudo OWASP Top 10 |
| **7** | Auditoria de Rastreabilidade (RTM) | `systems_analyst` | `/generate_rtm` | ⏳ PENDENTE | 100% Cobertura RFs / Zero Orphan |
| **8** | Linter Arquitetural (Zero Drift)| `system_architect` | `/verify_architecture` | ⏳ PENDENTE | Score 100/100 |
| **9** | Containerização & CI/CD | `devops_sre` | `/setup_infra` & `/setup_ci_cd` | ⏳ PENDENTE | `Dockerfile` & `.github/workflows/` |
| 🛡️ | **GATE 2: Release em Produção** | **Engenheiro Líder (Humano)** | `request_approval` (CodeLayer WUI) | ⏳ AGUARDANDO | Aprovação de Go-Live no WUI |
| **10** | Deploy Zero-Downtime & Runbook | `devops_sre` | `/deploy_release` | ⏳ PENDENTE | `thoughts/shared/runbooks/` |
| **11** | UAT Sign-Off & Handover Day-2 (TEP)| `systems_analyst` | `/project_closeout` | ⏳ PENDENTE | `thoughts/shared/governance/TEP-*.md` |
| **12** | Encerramento Oficial no Linear | `product_manager` | `/close_epic` | ⏳ PENDENTE | Projeto 100% no Linear |

---

## 🛡️ 3. Strategic Human-in-the-Loop Approval Gates

### Gate 1: Homologação de Concepção, Escopo & Fundamentos Arquiteturais
- **Critérios de Submissão:**
  - Termo de Abertura (TAP) com escopo In/Out e premissas formalizadas (`/project_charter`).
  - Especificação de Requisitos (SRS) com RFs MoSCoW, RNFs mensuráveis e Regras de Negócio (`/elicit_requirements`).
  - Modelagem UML 2.5: Casos de Uso com fluxos de exceção e Diagramas de Classe / Statecharts (`/model_use_cases`, `/model_domain`).
  - Design Tokens WCAG AAA validados e Wireframes aprovados (`/design_system`, `/create_wireframe`).
  - C4 Model (Níveis 1, 2 e 3) e ADRs fundamentais registradas (`/architect_system`, `/create_adr`).
  - Simulação de Carga e FinOps com projeção de custos aprovada.
- **Status do Gate:** `[PENDENTE / APROVADO / REJEITADO]`
- **Decisão Humana:** [Assinatura / Timestamp]

### Gate 2: Homologação de Release e Publicação em Produção
- **Critérios de Submissão:**
  - 100% dos testes unitários, integração e E2E Playwright passando.
  - Auditoria SAST OWASP Top 10 com 0 vulnerabilidades Críticas/Altas.
  - Matriz de Rastreabilidade (RTM) auditada com 100% dos RFs cobertos por código e testes (Zero Orphan, Zero Gold Plating).
  - Verificação de arquitetura com Zero Drift e score 100/100.
  - Migrações de banco de dados compatíveis (padrão Expand/Contract).
  - UAT Sign-off e Termo de Encerramento (TEP) emitido com runbooks N1-N3 (`/project_closeout`).
  - Runbook de Operações com procedimentos de rollback preenchidos.
- **Status do Gate:** `[PENDENTE / APROVADO / REJEITADO]`
- **Decisão Humana:** [Assinatura / Timestamp]

---

## 🏁 4. DoD (Definition of Done) Final Sign-Off
- [ ] TAP, SRS, Casos de Uso e Modelos de Domínio aprovados no Gate 1.
- [ ] RTM auditada garantindo rastreabilidade total (RF ➔ UC ➔ Linear ➔ Código ➔ Teste).
- [ ] Todos os PRs integrados na branch `main`.
- [ ] Pipeline do GitHub Actions 100% verde.
- [ ] Container publicado no GHCR com tag semântica de release.
- [ ] Healthcheck `/health/liveness` e `/health/readiness` respondendo 200 OK.
- [ ] UAT Sign-off e Termo de Encerramento (TEP) homologados.
- [ ] Épico e Tarefas filhas encerradas no Linear (`Done` / `Completed`).
