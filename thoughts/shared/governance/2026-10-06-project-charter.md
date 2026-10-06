# 📜 Termo de Abertura de Projeto (TAP / Project Charter)

**Nome do Projeto:** PayFlow Core - Gateway de Pagamentos e Ledger Financeiro Imutável  
**Código do Projeto / Repositório:** PAYFLOW-CORE / `payflow-core`  
**Patrocinador Executivo (Sponsor):** Diretor de Engenharia Financeira & FinOps  
**Gerente de Projeto / Squad Lead:** `squad_lead` (Orchestrator Agent)  
**Analista de Sistemas / Requisitos:** `systems_analyst`  
**Data de Criação:** 2026-10-06  
**Versão do Documento:** 1.0.0  
**Status:** Em Homologação / Gate 1  

---

## 🎯 1. Justificativa Estratégica & Business Case

### 1.1 Contexto e Oportunidade
- **Problema de Negócio:** Sistemas financeiros tradicionais sofrem com inconsistências contábeis decorrentes de modelos de saldo único mutável (*single-balance updates*), riscos severos de cobrança duplicada (*double-charge*) por falhas de rede, e falta de rastreabilidade ponta a ponta entre transações do gateway e as movimentações contábeis internas da empresa e dos merchants.
- **Solução Proposta:** Construção do **PayFlow Core**, uma plataforma moderna e unificada que integra um **Gateway de Pagamentos** resiliente com idempotência determinística e um **Ledger Financeiro de Partidas Dobradas** (*Double-Entry Ledger*) estritamente imutável (append-only), garantindo conformidade matemática $\sum \text{Débitos} = \sum \text{Créditos}$ em cada operação.
- **Retorno Esperado (ROI):** Redução a zero de divergências em conciliação financeira, eliminação total de cobranças duplicadas, diminuição de 95% no tempo de auditoria contábil e capacidade de processamento em escala com custo de infraestrutura previsível.

### 1.2 Objetivos SMART do Projeto
- **S (Específico):** Entregar a API REST core do PayFlow com gateway de pagamentos (Pix, Boleto, Cartão), motor de idempotência baseado em Redis/DB com hash SHA-256, dispatcher de webhooks assinados e ledger contábil imutável com plano de contas.
- **M (Mensurável):** Latência p95 < 50ms para lançamentos de ledger, suporte a concorrência sem race conditions, 100% de precisão contábil (zero centavos desalinhados) e cobertura de testes > 90%.
- **A (Atingível):** Construído sobre stack de alta performance: Bun runtime, TypeScript estrito, Fastify, SQLite/PostgreSQL com transações ACID, Zod para validação em borda e Docker multi-stage.
- **R (Relevante):** Núcleo habilitador para a expansão de produtos de pagamentos da companhia com conformidade regulatória e contábil.
- **T (Temporal):** Concepção, implementação e publicação concluídas com supervisão via Gate 1 e Gate 2.

---

## 🚧 2. Limites do Escopo (Scope Statement)

### 2.1 Escopo Incluído (In-Scope ✅)
- **Gestão de Merchants & Autenticação:** Cadastro de estabelecimentos, emissão de API Keys seguras com hash SHA-256 e RBAC.
- **Motor de Idempotência Determinística:** Header `Idempotency-Key` com bloqueio distribuído, armazenamento em cache da resposta e prevenção de execuções simultâneas concorrentes.
- **Gateway de Pagamentos:**
  - Criação e captura de cobranças (*Charges / Payment Intents*).
  - Métodos de pagamento: Pix (com QR Code/Payload dinâmico simulado), Boleto (código de barras e linha digitável) e Cartão de Crédito (tokenização e autorização).
  - Ciclo de vida: `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`.
- **Ledger Financeiro de Partidas Dobradas (Double-Entry Engine):**
  - Plano de Contas (*Chart of Accounts*) com categorias canônicas: Ativo (*Assets*), Passivo (*Liabilities*), Patrimônio Líquido (*Equity*), Receitas (*Revenue*), Despesas (*Expenses*).
  - Lançamentos contábeis compostos por débitos e créditos com validação matemática inegociável ($\sum \text{Debit} == \sum \text{Credit}$).
  - Append-only imutável: proibições de `UPDATE` e `DELETE` em lançamentos consolidados.
  - Estornos contábeis via lançamentos reversos compensatórios.
  - Consulta de saldos em tempo real e extrato com filtros por data e tipo.
- **Dispatcher de Webhooks:** Notificações de eventos (`payment.created`, `payment.paid`, `payment.refunded`) com assinatura HMAC-SHA256 (`X-Payflow-Signature`).
- **Observabilidade & SRE:** Endpoints `/health/liveness`, `/health/readiness` e métricas estruturadas.

### 2.2 Escopo Excluído (Out-of-Scope ❌)
- *Captura física via hardware de maquininhas de cartão (TEF/POS).*
- *Integração direta com a Rede do Sistema de Pagamentos Brasileiro (RSFN/BACEN) via CIP ou SPI direto (V1 utiliza simulação/adquirentes parceiros).*
- *Emissão automática de Nota Fiscal de Serviço eletrônica (NFS-e).*
- *Criptografia baseada em módulo físico de segurança (HSM); V1 utiliza chaves gerenciadas em software/KMS.*

---

## 👥 3. Stakeholders & Matriz RACI

| Papel no Projeto | Nome / Responsável | R (Executa) | A (Aprova) | C (Consulta) | I (Informa) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Sponsor Executivo** | Diretor de FinOps & Engenharia | | **X** | | **X** |
| **Squad Lead Orchestrator** | `squad_lead` | **X** | | **X** | |
| **Analista de Sistemas** | `systems_analyst` | **X** | | **X** | |
| **Product Manager** | `product_manager` | **X** | | **X** | |
| **Product Designer (UX/UI)**| `product_designer` | **X** | | **X** | |
| **System Architect** | `system_architect` | **X** | | **X** | |
| **Engenheiros de Software** | `implement_plan` / Devs | **X** | | | |
| **QA & AppSec Engineer** | `qa_engineer` | **X** | | | |
| **DevOps & SRE** | `devops_sre` | **X** | | | |

---

## 📌 4. Premissas e Restrições do Projeto

### Premissas:
1. Todos os valores monetários são representados obrigatoriamente em números inteiros (centavos / minor units, ex: `1000` = R$ 10,00) para eliminar erros de arredondamento de ponto flutuante (*IEEE 754 floating-point errors*).
2. O banco de dados suporta transações com nível de isolamento serializável ou locks pessimistas nas contas em movimentações concorrentes.
3. As APIs externas de merchants suportam verificação de assinatura HMAC-SHA256.

### Restrições:
1. Nenhuma dependência externa pode ter licença restritiva (GPL/AGPL).
2. Comunicação externa estritamente sob TLS 1.3.
3. O Ledger nunca realiza mutações destrutivas em registros contábeis.

---

## 🗓️ 5. Marcos Macro (Milestones)

| Marco | Entregável Principal | Critério de Aceite |
| :--- | :--- | :--- |
| **M1: Concepção & Arquitetura** | TAP, SRS, Casos de Uso, Domínio UML, Wireframes, C4 e ADRs | Homologação no Gate 1 |
| **M2: Backlog & RTM** | PRD técnico, RTM inicial e Tickets no Linear (ENG) | Backlog fatiado com dependências |
| **M3: Implementação Core** | Domain Models, Ledger Engine, Gateway, Idempotency e API Fastify | Testes unitários e de integração verdes |
| **M4: Qualidade & Segurança** | Suíte de testes automatizados e Auditoria OWASP Top 10 | 0 vulnerabilidades críticas |
| **M5: Conformidade & Infra** | Zero Architectural Drift, Dockerfile multi-stage, CI/CD | Pipeline verde e score 100/100 |
| **M6: Go-Live & Encerramento** | Runbook de Produção, Gate 2 aprovado, Tag v1.0.0 e TEP assinado | Projeto entregue e fechado |

---

## ✍️ 6. Aprovação e Formalização do Termo

- **Patrocinador Executivo:** Diretor de FinOps & Engenharia Financeira
- **Squad Lead Orchestrator:** `squad_lead`
