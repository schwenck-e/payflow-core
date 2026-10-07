---
description: Orquestração ponta a ponta da Autonomous Software Factory com subagentes especializados e Approval Gates
---

# Orquestração da Squad: Entrega Autônoma Ponta a Ponta (/autonomous_delivery)

Este comando aciona o **`squad-lead`** para orquestrar a fábrica de software autônoma (*Autonomous Software Factory*) ponta a ponta: desde a concepção visual e arquitetural até a entrega em produção com supervisão estratégica do usuário nos Approval Gates.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/autonomous_delivery "Construir Sistema de Gestão de Ordens de Serviço (ordem-servico-app)"
```
*(ou apontando para um brief existente: `/autonomous_delivery thoughts/shared/research/project-brief.md`)*

---

## 🚨 Regra Anti-Monólito & Delegação Mandatória

1. **PROIBIÇÃO DE MONÓLITO NA THREAD PRINCIPAL:**
   - O `squad-lead` é EXCLUSIVAMENTE um orquestrador. É **ESTRITAMENTE PROIBIDO** ao `squad-lead` criar código de produção (`src/`), modelos Prisma, diagramas C4 ou tokens de design diretamente em sua própria conversa.
   - Cada estágio DEVE ser despachado para o subagente especialista correspondente via ferramenta de subagente (`invoke_subagent` no Antigravity/Agy, ou despacho de agente no Claude Code).
   - Se rodando sob Antigravity/Agy e o subagente não estiver pré-registrado, o `squad-lead` deve defini-lo via `define_subagent` ou despachá-lo via `invoke_subagent` com seu System Prompt e Role apropriados.

2. **EVIDÊNCIA REAL DE TERMINAL (ZERO FAKE AUDITS):**
   - Laudos de testes, segurança (SAST) e infraestrutura NÃO podem ser simples arquivos markdown preenchidos sem comandos reais.
   - O `squad-lead` só pode autorizar a progressão de portões se houver stdout/stderr de comandos de terminal anexados comprovando que os testes rodaram, o build do Docker passou e os scanners de vulnerabilidade foram executados.

---

## 🔍 Fluxo de Execução com Approval Gates Nativos

Ao ser acionado, o `squad-lead` executa o seguinte fluxo em etapas:

1. **Inicialização do Manifesto de Entrega:**
   - Cria `thoughts/shared/squad/YYYY-MM-DD-squad-delivery-manifest.md` baseado no template `thoughts/shared/templates/squad_delivery_manifest_template.md`.

2. **Estágio 0 — Governança & Requisitos (`systems-analyst`):**
   - **Delega para:** Subagente `systems-analyst`.
   - Executa `/project_charter`, `/elicit_requirements`, `/model_use_cases` e `/model_domain`.
   - Gera TAP, SRS, Casos de Uso e Modelos de Domínio em `thoughts/shared/`.

3. **Estágio 1 — Concepção Visual & UX (`product-designer`):**
   - **Delega para:** Subagente `product-designer`.
   - Executa `/design_system` (tokens) e `/create_wireframe` (wireframes e jornadas) em `thoughts/shared/design/`.

4. **Estágio 2 — Fundação Arquitetural (`system-architect`):**
   - **Delega para:** Subagente `system-architect`.
   - Executa `/architect_system` (C4 Model), `/create_adr` (ADRs) e `/simulate_load` (FinOps & Carga) em `thoughts/shared/architecture/`.

5. **🛡️ GATE 1 — Aprovação Estratégica de Concepção & Arquitetura (Humano):**
   - O `squad-lead` pausa a execução e dispara `request_approval` no CodeLayer WUI exibindo os links dos wireframes, diagramas C4, ADRs e estimativa de custos.
   - O usuário revisa e aprova com 1 clique para autorizar o início do desenvolvimento.

6. **Estágio 3 — Fatiamento de Backlog & Linear (`product-manager`):**
   - **Delega para:** Subagente `product-manager`.
   - Executa `/plan_project`: gera o Mini-PRD técnico e os arquivos individuais de ticket em `thoughts/shared/tickets/` seguindo rigorosamente o `task_contract.md`.
   - Apresenta a árvore de tarefas ao usuário e, após autorização, sincroniza com o Linear (`ENG-XX`) com o Task Contract completo no corpo de cada issue.

7. **Estágio 4 — Implementação por Tarefa (Software Engineers):**
   - **Delega para:** Engenheiros de software especializados.
   - **Isolamento de Git:** Para cada tarefa (`ENG-XX`), cria branch `git checkout -b feature/ENG-XX-<slug>` (ou Git worktree).
   - Implementa código com testes unitários atômicos.
   - Commits convencionais referenciando a issue (`feat(...): ... [ENG-XX]`).
   - Push para origin: `git push -u origin feature/ENG-XX-<slug>`.
   - Abertura de Pull Request via `gh pr create` ou MCP GitHub.

8. **Estágio 5 — Qualificação & Segurança (`qa-engineer`):**
   - **Delega para:** Subagente `qa-engineer`.
   - Executa `/generate_tests`: pirâmide de testes unitários, testes de integração e **testes de concorrência** para regras financeiras/críticas.
   - Executa `/security_audit`: roda scanner SAST real no terminal e gera relatório OWASP Top 10 com evidências reais.

9. **Estágio 6 — Conformidade e Rastreabilidade (`system-architect` & `systems-analyst`):**
   - Executa `/verify_architecture` para auditar drift arquitetural (Score 100/100).
   - Executa `/generate_rtm` para validar 100% de rastreabilidade de requisitos para testes.

10. **Estágio 7 — Infraestrutura & CI/CD (`devops-sre`):**
    - **Delega para:** Subagente `devops-sre`.
    - Executa `/setup_infra` e `/setup_ci_cd`: Dockerfile multi-stage, `docker-compose.yml`, pipeline GitHub Actions e Runbook operacional.
    - Valida o build do contêiner e a sintaxe do pipeline localmente.

11. **🛡️ GATE 2 — Aprovação Final de Publicação em Produção (Humano):**
    - O `squad-lead` dispara `request_approval` exibindo o laudo de testes 100% verdes com saída real do terminal, auditoria de segurança, checklist de migrações e o Runbook.
    - O usuário aprova o Go-Live oficial no CodeLayer WUI.

12. **Estágio 8 — Publicação, UAT & Encerramento:**
    - O `devops-sre` executa `/deploy_release` (merge para `main`, bump semântico, Git Tag anotada e push de tags).
    - O `systems-analyst` executa `/project_closeout` (Termo de Encerramento do Projeto - TEP e sign-off UAT).
    - O `product-manager` executa `/close_epic` no Linear (valida DoD de todas as issues e fecha o épico).
