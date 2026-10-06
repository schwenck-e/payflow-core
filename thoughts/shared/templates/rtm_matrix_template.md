# 🔗 Matriz de Rastreabilidade de Requisitos (RTM)
### *Requirements Traceability Matrix — Padrão IEEE 29148*

**Projeto:** [Nome do Projeto]  
**Referência SRS:** [thoughts/shared/requirements/YYYY-MM-DD-srs-specification.md]  
**Analista Responsável:** [Systems Analyst Agent]  
**Data da Última Auditoria:** [YYYY-MM-DD]  
**Versão:** 1.0.0  
**Status de Cobertura Global:** [ 100% COBERTO ✅ / 🟡 EM ANDAMENTO / 🔴 LACUNAS DETECTADAS ]  

---

## 🎯 1. Visão Geral da Matriz

A **Matriz de Rastreabilidade de Requisitos (RTM)** é a garantia matemática de que:
1. **Nenhum requisito de negócio ficou sem implementação ou sem teste.** (Zero Requisitos Órfãos).
2. **Nenhuma linha de código foi escrita sem um requisito formal que a justifique.** (Zero *Gold Plating* / Escopo Fantasma).

---

## 📊 2. Matriz Bidirecional de Rastreabilidade

| Requisito Formal | Descrição Sintética | Caso de Uso | Regra de Negócio | Ticket Linear | Componente / Arquivo de Código | Teste Automatizado | Status |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- | :---: |
| **RF-001** | Autenticação JWT e RBAC | UC-001 | - | ENG-10 | `src/modules/auth/auth.service.ts` | `tests/auth.test.ts` | ✅ COBERTO |
| **RF-002** | Cadastro e Gestão de Clientes | UC-002 | - | ENG-11 | `src/modules/clients/clients.service.ts` | `tests/clients.test.ts` | ✅ COBERTO |
| **RF-003** | Abertura de Ordem de Serviço | UC-003 | RN-002, RN-004 | ENG-12 | `src/modules/orders/create-order.service.ts` | `tests/orders/create-order.test.ts` | ✅ COBERTO |
| **RF-004** | Atribuição de Técnico | UC-004 | - | ENG-13 | `src/modules/orders/assign-technician.ts` | `tests/orders/assign.test.ts` | ✅ COBERTO |
| **RF-005** | Apontamento de Peças | UC-005 | RN-003 | ENG-14 | `src/modules/orders/order-items.service.ts` | `tests/orders/items.test.ts` | ✅ COBERTO |
| **RF-006** | Conclusão da OS com Laudo | UC-006 | RN-001, RN-005 | ENG-15 | `src/modules/orders/complete-order.service.ts`| `tests/e2e/order-complete.spec.ts` | ✅ COBERTO |
| **RF-007** | Cancelamento de Ordem | UC-007 | RN-003, RN-005 | ENG-16 | `src/modules/orders/cancel-order.service.ts` | `tests/orders/cancel.test.ts` | ✅ COBERTO |
| **RNF-001**| Performance sub-150ms | - | - | ENG-17 | `src/infra/database/prisma-client.ts` | `tests/perf/load-smoke.test.ts` | ✅ COBERTO |
| **RNF-003**| Segurança e Hashing bcrypt| UC-001 | - | ENG-10 | `src/shared/security/hasher.ts` | `thoughts/shared/qa/security_audit.md` | ✅ COBERTO |
| **RNF-005**| Acessibilidade WCAG AAA | - | - | ENG-18 | `src/components/ui/` | `tests/a11y/axe.test.ts` | ✅ COBERTO |

---

## 📈 3. Métricas de Auditoria e Cobertura

- **Total de Requisitos Funcionais:** 7
- **Total de Requisitos Não-Funcionais:** 6
- **Total de Regras de Negócio Mapeadas:** 5
- **Requisitos com Casos de Uso Vinculados:** 100%
- **Requisitos com Tickets no Linear:** 100%
- **Requisitos com Código Implementado:** 100%
- **Requisitos com Testes Automatizados Passing:** 100%
- **Lacunas / Requisitos Órfãos:** 0 (Zero Drift)

---

## ✍️ 4. Parecer de Auditoria do Analista de Sistemas

> **Laudo de Conformidade:** Declaramos que a matriz de rastreabilidade foi auditada em sua totalidade. Todos os 7 requisitos funcionais possuem controladores, serviços de domínio e suítes de teste de integração e E2E correspondentes. Nenhuma violação de regra de negócio foi encontrada. O sistema está apto para submissão ao Gate de Homologação Executiva.
