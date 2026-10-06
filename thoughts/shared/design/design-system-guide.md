# 🎨 PayFlow Core Design System & Component Guidelines

**Projeto:** PayFlow Core - Gateway de Pagamentos e Ledger Financeiro  
**Designer:** `product_designer`  
**Data:** 2026-10-06  
**Acessibilidade:** WCAG 2.1 AAA (Contraste mínimo 4.5:1 para texto normal e 3:1 para controles de UI)

---

## 💎 1. Identidade e Semântica Financeira

A paleta foi concebida para alta densidade analítica, consoles de monitoramento contábil e operadores de tesouraria:
- **Canvas Noturno (`#090D16`):** Reduz fadiga visual em turnos operacionais prolongados.
- **Credit / Entrada (`#10B981`):** Indicador positivo de crédito e liquidação aprovada.
- **Debit / Saída (`#F59E0B`):** Indicador de retenção, estorno ou alocação em trânsito.
- **Brand Indigo (`#4F46E5`):** Botões de ação primária, filtros ativos e estados focados.
- **Typography:** `Inter` para legibilidade rápida de labels e `JetBrains Mono` para dígitos monetários, hashes SHA-256 e chaves de idempotência.

---

## 📐 2. Padrões de Exibição de Valores Monetários

- **Alinhamento Numérico:** Todos os valores monetários em tabelas contábeis devem usar `font-mono text-right`.
- **Formatação de Centavos:** NUNCA formatar centavos como números de ponto flutuante diretamente no frontend sem conversão com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Badges de Status:**
  - `PAID`: `bg-emerald-950 text-emerald-400 border border-emerald-800`
  - `PENDING`: `bg-amber-950 text-amber-400 border border-amber-800`
  - `FAILED`: `bg-rose-950 text-rose-400 border border-rose-800`
  - `REFUNDED`: `bg-purple-950 text-purple-400 border border-purple-800`
