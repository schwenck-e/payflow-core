# 📐 Screen Wireframe & UI Component Specification: PayFlow Core Console

**Screen / View Name:** PayFlow Transaction Gateway & Ledger Explorer Console  
**Linear Task:** ENG-PAYFLOW-UI: Dashboard de Cobranças e Livro-Razão  
**Designer:** `product_designer`  
**Data:** 2026-10-06  
**Target Viewports:** Mobile (375px), Desktop (1440px+)  

---

## 🖼️ 1. Layout Structural Blueprint

### Desktop Layout (1440px+):
```text
+-------------------------------------------------------------------------------------------------------------+
| [⚡ PayFlow Core]  Status: [● 100% OPERATIONAL]  |  Merchant: Acme Payments (merch_99)  | [API Keys] [Docs] |
+---------------------+---------------------------------------------------------------------------------------+
|  Navigation         | KPI METRICS OVERVIEW (Últimas 24h)                                                    |
|  - Cobranças (●)    | [ Total Processado: R$ 1.482.900,00 ] [ Ledger Balanço: 100% ACID ] [ Erros: 0,00% ]  |
|  - Double-Entry     +---------------------------------------------------------------------------------------+
|    Ledger           | FILTROS: [ Método: Todos v ] [ Status: PAID v ] [ Data: Hoje v ]  [ + Nova Cobrança ]  |
|  - Plano de Contas  +---------------------------------------------------------------------------------------+
|  - Webhooks Log     | TRANSAÇÕES RECENTES & PARTIDAS DOBRADAS (LIVE FEED)                                   |
|  - Idempotência     | ID        Método   Valor Bruto   Taxa (Fee)   Líquido     Status   Ledger Tx    Ações  |
|                     | ch_8491   [PIX]    R$ 150,00     R$ 1,48      R$ 148,52   [PAID]   tx_9918 (OK) [...]  |
|  Configurações      | ch_8492   [CARD]   R$ 1.200,00   R$ 29,88     R$ 1.170,12 [PAID]   tx_9919 (OK) [...]  |
|  - Chaves de API    | ch_8493   [BOL]    R$ 450,00     R$ 3,50      R$ 446,50   [PEND]   --           [...]  |
|                     +---------------------------------------------------------------------------------------+
|  Extrato Contábil   | DETALHE DO LANÇAMENTO DE PARTIDAS DOBRADAS (tx_9919 selecionada):                     |
|  Ativo vs Passivo   | 1. DEBIT  | Conta de Clearing (Gateway Ativo) | R$ 1.200,00                          |
|                     | 2. CREDIT | Wallet do Merchant (Passivo)      | R$ 1.170,12                          |
|                     | 3. CREDIT | Receita de Taxa (Plataforma)      | R$    29,88                          |
|                     | TOTAL DEBIT = R$ 1.200,00 == TOTAL CREDIT = R$ 1.200,00 [INVARIANTE RN-001 CONFORME] |
+---------------------+---------------------------------------------------------------------------------------+
```

### Mobile Layout (375px):
```text
+-----------------------------------+
| [⚡ PayFlow]             [Merch v] |
+-----------------------------------+
| Total 24h: R$ 1.482.900,00        |
| Ledger Invariante: 100% BALANCEADO|
+-----------------------------------+
| Cobranças Recentes                |
| +-------------------------------+ |
| | ch_8491 • PIX          [PAID] | |
| | R$ 150,00                     | |
| | Ledger: tx_9918 (Equilibrado) | |
| +-------------------------------+ |
| +-------------------------------+ |
| | ch_8492 • CARTÃO       [PAID] | |
| | R$ 1.200,00                   | |
| | Ledger: tx_9919 (Equilibrado) | |
| +-------------------------------+ |
| [ + Criar Cobrança Rápida ]       |
+-----------------------------------+
```

---

## 🎛️ 2. Comprehensive UI State Matrix

### 2.1 Default / Active State
- Linhas com cores semânticas imediatas:
  - `PAID`: Badge verde esmeralda com ícone de check contábil.
  - `PENDING`: Badge âmbar com relógio de expiração.
  - `REFUNDED`: Badge roxo com link direto para o lançamento compensatório de estorno.
- Painel inferior sincronizado mostrando a decomposição contábil (Débito e Crédito) em tempo real da transação selecionada.

### 2.2 Loading / Skeleton State
- Skeletons em cinza escuro pulsante (`animate-pulse bg-slate-800 rounded`) nas tabelas e KPIs, sem alteração de altura ou Cumulative Layout Shift (CLS = 0).

### 2.3 Empty State (Zero Data)
- **Ícone:** `Scale` ou `CreditCard` sutil em cinza azulado.
- **Mensagem:** "Nenhuma transação processada no período selecionado."
- **Ação:** Botão destacado `[+ Emitir Primeira Cobrança via API]`.

### 2.4 Error State (API Timeout / Assinatura Inválida)
- Banner vermelho escuro sutil com mensagem explicativa e botão `[Reconectar Gateway]`.
