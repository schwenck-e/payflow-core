# 📜 Termo de Abertura de Projeto (TAP / Project Charter)

**Nome do Projeto:** [e.g., Sistema de Gestão de Ordens de Serviço (ordem-servico-app)]  
**Código do Projeto / Repositório:** [e.g., OS-APP / github.com/org/repo]  
**Patrocinador Executivo (Sponsor):** [Nome / Cargo / Diretoria]  
**Gerente de Projeto / Squad Lead:** [Nome / Agente Squad Lead]  
**Analista de Sistemas / Requisitos:** [Nome / Agente Systems Analyst]  
**Data de Criação:** [YYYY-MM-DD]  
**Versão do Documento:** 1.0.0  
**Status:** [Rascunho / Em Aprovação / Aprovado]  

---

## 🎯 1. Justificativa Estratégica & Business Case

### 1.1 Contexto e Oportunidade
- **Problema de Negócio:** [Descrever a dor atual, ineficiência de processos, perda financeira ou limitação técnica.]
- **Solução Proposta:** [Descrever a iniciativa que resolverá o problema através de software autônomo.]
- **Retorno Esperado (ROI):** [Métricas financeiras ou operacionais esperadas: ex. redução de 40% no tempo de atendimento.]

### 1.2 Objetivos SMART do Projeto
- **S (Específico):** [Entregar um sistema web responsivo para abertura, acompanhamento e faturamento de ordens de serviço.]
- **M (Mensurável):** [Suportar até 500 ordens simultâneas com tempo de resposta < 200ms e 99.9% de disponibilidade.]
- **A (Atingível):** [Construído com stack moderna e comprovada: Fastify, React, SQLite/PostgreSQL e Docker.]
- **R (Relevante):** [Alinhado ao objetivo estratégico corporativo de digitalização de processos operacionais.]
- **T (Temporal):** [Homologado e em produção no prazo acordado de N semanas/sprints.]

---

## 🚧 2. Limites do Escopo (Scope Statement)

### 2.1 Escopo Incluído (In-Scope ✅)
- Módulo de Autenticação e RBAC (Administrador, Coordenador, Técnico de Campo).
- Gestão cadastral de Clientes e Técnicos.
- Ciclo de vida completo da Ordem de Serviço (Abertura, Atribuição, Execução, Conclusão, Cancelamento).
- Anexação de fotos/laudos e coleta de assinatura digital na finalização da OS.
- Relatórios operacionais em tempo real e exportação em formato padrão.

### 2.2 Escopo Excluído (Out-of-Scope ❌)
- *Integração com sistemas ERP legados (SAP/Totvs) nesta versão (planejado para Fase 2).*
- *Processamento de pagamento com cartão de crédito presencial via maquininha (TEF).*
- *Aplicativo mobile nativo para iOS/Android (a V1 será PWA responsivo no navegador).*

---

## 👥 3. Stakeholders & Matriz RACI

| Papel no Projeto | Nome / Responsável | R (Executa) | A (Aprova) | C (Consulta) | I (Informa) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Sponsor Executivo** | [Nome do Patrocinador] | | **X** | | **X** |
| **Squad Lead Orchestrator** | `squad_lead` | **X** | | **X** | |
| **Analista de Sistemas** | `systems_analyst` | **X** | | **X** | |
| **Product Manager** | `product_manager` | **X** | | **X** | |
| **Product Designer (UX/UI)**| `product_designer` | **X** | | **X** | |
| **System Architect** | `system_architect` | **X** | | **X** | |
| **Engenheiros de Software** | `implement_plan` / Devs | **X** | | | |
| **QA & AppSec Engineer** | `qa_engineer` | **X** | | | |
| **DevOps & SRE** | `devops_sre` | **X** | | | |
| **Usuários Operacionais (Técnicos)** | Representantes de Campo | | | **X** | **X** |

---

## 📌 4. Premissas e Restrições do Projeto

### Premissas:
1. Os dados de clientes e técnicos estarão disponíveis para carga inicial (seed) no formato CSV/JSON.
2. A infraestrutura de computação em nuvem terá suporte nativo a containers Docker.
3. O patrocinador executivo validará os Approval Gates no CodeLayer WUI em até 24 horas.

### Restrições:
1. Orçamento de computação limitado a R$ N / mês conforme simulação FinOps.
2. Todo o tráfego externo deve ser criptografado via TLS 1.3 obrigatório.
3. Zero dependência de bibliotecas com licenças restritivas incompatíveis (GPL/AGPL).

---

## 🗓️ 5. Marcos Macro (Milestones)

| Marco | Entregável Principal | Critério de Aceite | Data Alvo |
| :--- | :--- | :--- | :---: |
| **M1: Especificação & Design** | TAP, SRS, UML, Wireframes e C4 Model | Aprovação formal no Gate 1 | Semana 1 |
| **M2: Backlog & Fundação** | Backlog fatiado no Linear e Docker Base | Tickets criados e compose funcional | Semana 1 |
| **M3: Núcleo Operacional** | Backend API e CRUDs de domínio implementados | 100% dos testes unitários verdes | Semana 2 |
| **M4: Frontend & E2E** | Telas funcionais e testes Playwright | Fluxo ponta a ponta sem erros | Semana 3 |
| **M5: Homologação UAT** | RTM auditada, SAST zero CVEs, Runbook | Aprovação formal no Gate 2 | Semana 4 |
| **M6: Go-Live & Encerramento** | Deploy em produção e Termo de Encerramento (TEP)| DoD 100% no Linear e TEP assinado | Semana 4 |

---

## ✍️ 6. Aprovação e Formalização do Termo

A assinatura deste documento autoriza formalmente a alocação de recursos da squad e o início da esteira de Engenharia de Requisitos.

- **Patrocinador Executivo (Sponsor):** _____________________________ Data: ____/____/________
- **Squad Lead / Líder Técnico:** __________________________________ Data: ____/____/________
