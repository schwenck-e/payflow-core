# [ADR-003] Representação Estrita de Moeda em Unidades Mínimas Inteiras (Minor Units / Centavos)

- **Status:** Aprovado / Submetido ao Gate 1
- **Data:** 2026-10-06
- **Classificação:** Tipo 1 (Irreversível / One-Way Door)
- **Decisores:** System Architect, Systems Analyst
- **Componentes Afetados:** Todos os modelos de dados, DTOs, cálculos contábeis, schemas Zod e banco de dados

---

## 1. Contexto & Declaração do Problema
O padrão IEEE 754 de ponto flutuante binário (utilizado por tipos primitivos `float` e `double` na maioria das linguagens de programação, incluindo JavaScript/TypeScript `number`) não consegue representar com exatidão frações decimais simples (ex: `0.1 + 0.2 === 0.30000000000000004`). Em sistemas financeiros, essas imprecisões acumulam resíduos fracionários que quebram a asserção matemática $\sum \text{Débitos} = \sum \text{Créditos}$ e geram furos contábeis inaceitáveis.

---

## 2. Decisão Escolhida & Justificativa
**Decidimos adotar formalmente o padrão de Minor Units (Centavos / Inteiros) em 100% da plataforma.**
- Nenhuma coluna de banco, DTO de API ou entidade de domínio utilizará `float` ou `real`.
- Todos os campos monetários terminam com o sufixo `_in_cents` e são tipados como inteiros (`Int` ou `BigInt`).
  - R$ 1,00 = `100` centavos
  - R$ 1.250,50 = `125050` centavos
- Cálculos percentuais (ex: taxas) utilizam divisão inteira com arredondamento explícito (*Half-Even* ou *Floor*) e reconciliação dos centavos residuais na parcela da plataforma.

---

## 3. Consequências & Impactos
### Positivas:
- Precisão matemática exata e invariante contábil imune a erros de ponto flutuante.
- Compatibilidade direta com SQLite `INTEGER`, PostgreSQL `BIGINT` e TypeScript `bigint`.
