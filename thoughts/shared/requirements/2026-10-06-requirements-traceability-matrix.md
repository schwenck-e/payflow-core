# 🔗 Matriz de Rastreabilidade de Requisitos (RTM)
### *Requirements Traceability Matrix — Padrão ISO/IEC/IEEE 29148*

**Projeto:** PayFlow Core - Gateway de Pagamentos e Ledger Financeiro Imutável  
**Referência SRS:** `thoughts/shared/requirements/2026-10-06-srs-specification.md`  
**Linear Epic / Project:** [PayFlow Core Platform (Linear)](https://linear.app/elima/project/payflow-core-gateway-de-pagamentos-e-ledger-financeiro-4d85932c7012)  
**Analista Responsável:** `systems_analyst`  
**Data da Auditoria:** 2026-10-06  
**Versão:** 1.0.0  
**Status de Cobertura Global:** 100% IMPLEMENTADO & AUDITADO ✅  

---

## 🎯 1. Visão Geral da Matriz

A **Matriz de Rastreabilidade de Requisitos (RTM)** certifica que:
1. **Zero Requisitos Órfãos:** 100% dos requisitos funcionais e não-funcionais foram implementados e cobertos por testes automatizados.
2. **Zero Escopo Fantasma (Gold Plating):** Todo o código implementado corresponde a requisitos canônicos e casos de uso formalizados.

---

## 📊 2. Matriz Bidirecional de Rastreabilidade

| Requisito Formal | Descrição Sintética | Caso de Uso | Regra de Negócio | Ticket Linear | Componente / Arquivo de Código | Teste Automatizado | Status |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- | :---: |
| **RF-001** | Autenticação Merchant & API Keys | UC-001 | - | ENG-45, ENG-51 | `src/presentation/middlewares/auth.middleware.ts` | `tests/integration/payment-flow.test.ts` | ✅ COBERTO |
| **RF-002** | Motor de Idempotência Determinística | UC-002 | RN-003 | ENG-47 | `src/domain/services/idempotency.service.ts` | `tests/unit/idempotency.service.test.ts` | ✅ COBERTO |
| **RF-003** | Cobrança Pix com Payload EMV | UC-002 | RN-006 | ENG-48 | `src/domain/services/payment.service.ts` | `tests/integration/payment-flow.test.ts` | ✅ COBERTO |
| **RF-004** | Cobrança Cartão (Luhn & Captura) | UC-002 | RN-006 | ENG-48 | `src/domain/services/payment.service.ts` | `tests/integration/payment-flow.test.ts` | ✅ COBERTO |
| **RF-005** | Cobrança Boleto Bancário | UC-002 | RN-006 | ENG-48 | `src/domain/services/payment.service.ts` | `src/domain/services/payment.service.ts` | ✅ COBERTO |
| **RF-006** | Liquidação Contábil de Cobrança | UC-003 | RN-001, RN-002 | ENG-46, ENG-48 | `src/domain/services/ledger.service.ts` | `tests/integration/payment-flow.test.ts` | ✅ COBERTO |
| **RF-007** | Estorno com Compensação Contábil | UC-004 | RN-001, RN-005 | ENG-49 | `src/domain/services/payment.service.ts` | `tests/integration/refund-flow.test.ts` | ✅ COBERTO |
| **RF-008** | Gestão de Plano de Contas | UC-005 | RN-004 | ENG-45, ENG-46 | `src/domain/entities/account.entity.ts` | `tests/unit/account.entity.test.ts` | ✅ COBERTO |
| **RF-009** | Partidas Dobradas ($\sum D = \sum C$) | UC-003, UC-006 | RN-001, RN-002 | ENG-46 | `src/domain/entities/ledger-transaction.entity.ts` | `tests/unit/ledger-double-entry.test.ts` | ✅ COBERTO |
| **RF-010** | Consulta de Saldos e Extrato | UC-007 | RN-004 | ENG-46, ENG-51 | `src/presentation/controllers/ledger.controller.ts`| `tests/integration/payment-flow.test.ts` | ✅ COBERTO |
| **RF-011** | Disparo de Webhooks HMAC-SHA256 | UC-008 | - | ENG-50 | `src/domain/services/webhook.service.ts` | `tests/unit/webhook.service.test.ts` | ✅ COBERTO |
| **RF-012** | Probes de Saúde (/health) | - | - | ENG-51 | `src/presentation/controllers/health.controller.ts`| `tests/integration/health.test.ts` | ✅ COBERTO |
| **RNF-001**| Performance sub-40ms no Ledger | - | - | ENG-46 | `src/domain/services/ledger.service.ts` | `tests/integration/payment-flow.test.ts` | ✅ COBERTO |
| **RNF-002**| Consistência Contábil Matemática | UC-003 | RN-001 | ENG-46 | `src/domain/entities/ledger-transaction.entity.ts` | `tests/unit/ledger-double-entry.test.ts` | ✅ COBERTO |
| **RNF-003**| Idempotência e Zero Double-Charge| UC-002 | RN-003 | ENG-47 | `src/domain/services/idempotency.service.ts` | `tests/unit/idempotency.service.test.ts` | ✅ COBERTO |
| **RNF-004**| Imutabilidade Append-Only Ledger | UC-003 | RN-002 | ENG-46 | `src/infrastructure/database/` | `tests/unit/ledger-double-entry.test.ts` | ✅ COBERTO |
| **RNF-005**| Minor Units (Zero Float Point) | - | RN-001 | ENG-45, ENG-46 | `src/domain/value-objects/money.vo.ts` | `tests/unit/money.vo.test.ts` | ✅ COBERTO |
| **RNF-006**| Criptografia SHA-256 e HMAC | UC-001, UC-008| - | ENG-45, ENG-50 | `src/infrastructure/security/hash.ts` | `tests/unit/webhook.service.test.ts` | ✅ COBERTO |
| **RNF-007**| Confiabilidade & Health Probes | - | - | ENG-53 | `src/presentation/controllers/health.controller.ts`| `tests/integration/health.test.ts` | ✅ COBERTO |

---

## 📈 3. Métricas de Auditoria
- **Requisitos Funcionais Cobertos:** 12 / 12 (100%)
- **Requisitos Não-Funcionais Cobertos:** 7 / 7 (100%)
- **Regras de Negócio Testadas:** 6 / 6 (100%)
- **Requisitos Órfãos:** 0 (Zero Drift)
- **Status Geral:** 100% HOMOLOGADO ✅
