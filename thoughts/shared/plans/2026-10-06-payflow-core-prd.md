# 📋 Mini-PRD Técnico: PayFlow Core Platform

**Épico / Projeto:** PayFlow Core - Gateway de Pagamentos e Ledger Financeiro Imutável  
**Linear Target:** Team ENG (`53cb0c7a-5e62-4dc4-aa13-b0ffc6eaf131`)  
**Product Manager:** `product_manager`  
**Data:** 2026-10-06  
**Status:** Aprovado pós-Gate 1  

---

## 1. Resumo Executivo (TL;DR)
- **Problema:** Riscos de double-charge em pagamentos por instabilidades de rede e ausência de reconciliação contábil confiável em plataformas financeiras.
- **Solução Proposta:** Plataforma centralizada com motor de cobranças (Pix, Boleto, Cartão), motor de idempotência baseado em hash SHA-256 e livro-razão contábil de partidas dobradas (*Double-Entry Ledger*) append-only, com garantia matemática $\sum \text{Debit} == \sum \text{Credit}$.
- **Critério de Sucesso:** 100% de precisão contábil, zero cobranças duplicadas, cobertura de testes > 90% e tempo de resposta de ledger < 40ms.

---

## 2. Escopo & Não-Escopo (Scope Boundaries)
### In-Scope (MVP)
- Autenticação de Merchant via Bearer API Keys com hash seguro SHA-256.
- Idempotência rigorosa de requisições com header `Idempotency-Key` e cache de 24h.
- Criação e captura de cobranças para Pix, Cartão de Crédito e Boleto.
- Livro-razão contábil de partidas dobradas com contas de Ativo, Passivo, Receitas e Despesas.
- Validação inegociável da invariante contábil ($\sum \text{Débitos} = \sum \text{Créditos}$).
- Estorno (refund) parcial e total com lançamento compensatório reverso no ledger.
- Dispatcher de webhooks com assinatura HMAC-SHA256 no header `X-Payflow-Signature`.
- Endpoints de monitoramento `/health/liveness` e `/health/readiness`.
- Containerização Docker multi-stage e pipeline GitHub Actions.

### Out-of-Scope (Fase 2)
- Hardware físico POS/TEF.
- Integração direta SPI/CIP BACEN sem adquirente/banco intermediário.
- Emissão de NFS-e municipal.

---

## 3. Fatiamento em Tarefas Verticais (Linear Breakdown)

1. **ENG-PAYFLOW-1: Tooling, Estrutura de Domínio & Schema Prisma**  
   Setup de runtime Bun/TypeScript, Fastify, Schema Prisma com entidades `Merchant`, `ApiKey`, `Account`, `LedgerTransaction`, `LedgerEntry`, `Charge`, `Refund`, `IdempotencyRecord`.
2. **ENG-PAYFLOW-2: Core Engine de Double-Entry Ledger Imutável**  
   Implementação de entidades, cálculo de saldos em centavos (`amount_in_cents`), validação da regra RN-001 ($\sum \text{Debit} == \sum \text{Credit}$) e proibição de updates destrutivos (RN-002).
3. **ENG-PAYFLOW-3: Motor de Idempotência Determinística**  
   Middleware de captura de `Idempotency-Key`, cálculo de hash SHA-256 do payload, prevenção de concorrência com locks e replay de respostas em cache (RN-003).
4. **ENG-PAYFLOW-4: Gateway de Pagamentos e Liquidação Contábil**  
   Orquestração de cobranças Pix (EMV payload), Cartão de Crédito (Luhn & validação) e Boleto, com postagem automática e atômica no Ledger.
5. **ENG-PAYFLOW-5: Estorno com Lançamentos Contábeis Reversos**  
   Fluxo de devolução com validação de limite acumulado (RN-005) e criação de transação compensatória no Ledger.
6. **ENG-PAYFLOW-6: Dispatcher de Webhooks com HMAC-SHA256**  
   Módulo de notificação com envelope de eventos e assinatura criptográfica `X-Payflow-Signature`.
7. **ENG-PAYFLOW-7: Rotas REST Fastify, Auth Guard e Health Probes**  
   Controllers HTTP, validação com schemas Zod, verificação de API Keys e endpoints `/health/liveness` e `/health/readiness`.
8. **ENG-PAYFLOW-8: Suíte de Testes Automatizados e Auditoria de Segurança**  
   Pirâmide de testes unitários e de integração com cobertura de cenários de borda e auditoria SAST OWASP Top 10.
9. **ENG-PAYFLOW-9: Infraestrutura Docker Multi-Stage e CI/CD GitHub Actions**  
   Dockerfile com base leve, `docker-compose.yml` e pipeline `.github/workflows/ci.yml`.
