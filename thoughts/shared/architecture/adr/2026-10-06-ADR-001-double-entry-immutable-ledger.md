# [ADR-001] Adoção de Livro-Razão Contábil de Partidas Dobradas Estritamente Imutável (Double-Entry Append-Only Ledger)

- **Status:** Aprovado / Submetido ao Gate 1
- **Data:** 2026-10-06
- **Classificação:** Tipo 1 (Irreversível / One-Way Door)
- **Decisores:** System Architect, Systems Analyst, Sponsor Financeiro
- **Componentes Afetados:** Ledger Core, Database Engine, Payment Service, Accounting Audit

---

## 1. Contexto & Declaração do Problema
Sistemas de pagamento que mantêm saldos através de colunas numéricas mutáveis com comandos do tipo `UPDATE accounts SET balance = balance + 100` sofrem de sérios problemas de auditoria, perda de rastro transacional diante de race conditions, incapacidade de provar a origem de divergências contábeis e impossibilidade de realizar reconciliações históricas pontuais.

---

## 2. Forças & Requisitos Não-Funcionais (NFRs)
- **Consistência Contábil Matemática (RN-001):** Toda operação financeira deve preservar a conservação de valor: $\sum \text{Débitos} = \sum \text{Créditos}$.
- **Imutabilidade e Rastreabilidade (RN-002 / RNF-004):** Registros contábeis não podem ser editados ou deletados após criados.
- **Isolamento ACID:** Lançamentos em múltiplas contas precisam ser atômicos no banco de dados.

---

## 3. Opções Avaliadas

### Opção 1: Saldo Mutável Simples com Tabela de Extrato Opcional
* **Prós:** Simplicidade inicial de implementação; poucas linhas de código.
* **Contras:** Vulnerável a race conditions de concorrência, perda de integridade contábil, impossibilidade de auditoria forense.
* **FinOps:** Baixo volume de storage inicial, mas custo exorbitante em auditorias manuais.

### Opção 2: Double-Entry Ledger com Partidas Dobradas Append-Only
* **Prós:** Rastreabilidade matemática 100% comprovada; cada transação contém no mínimo duas entradas vinculadas cujo somatório de débitos é exatamente igual ao de créditos; conformidade com os princípios fundamentais da contabilidade universal; histórico auditável perpétuo.
* **Contras:** Exige disciplina arquitetural e consultas de saldo requerem agregação ou agregação assistida por snapshots.
* **FinOps:** Crescimento previsível de storage indexado (~50 bytes por entry).

---

## 4. Decisão Escolhida & Justificativa
**Decidimos adotar a Opção 2: Double-Entry Ledger Append-Only**. Toda e qualquer movimentação de fundos gerará uma `LedgerTransaction` contendo um array de `LedgerEntry`, com verificação em tempo de execução de que $\sum \text{Debits} == \sum \text{Credits}$. Nenhuma operação de `UPDATE` ou `DELETE` será permitida sobre essas tabelas.

---

## 5. Consequências & Impactos
### Positivas:
- Erros de conciliação caem para zero.
- Conformidade com normas contábeis internacionais e requisitos de auditoria externa (BACEN, SOX).
- Estornos são tratados de forma limpa como novos lançamentos compensatórios (*reversal postings*).

### Riscos Mitigados:
- Para evitar sobrecarga em somas de contas com milhões de entradas, um campo `current_balance_in_cents` é atualizado atomicamente na mesma transação ACID sob lock pessimista da conta.
