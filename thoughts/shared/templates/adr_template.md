# [ADR-XXXX] [Título Sucinto da Decisão Arquitetural]

- **Status:** Proposto | Aprovado | Depreciado | Substituído por [ADR-YYYY]
- **Data:** YYYY-MM-DD
- **Classificação:** Tipo 1 (Irreversível / Portas de mão única) | Tipo 2 (Reversível)
- **Decisores:** [Engenharia / Arquitetura / Usuário]
- **Componentes Afetados:** [ex: API Backend, Banco de Dados, Mensageria, Frontend]

---

## 1. Contexto & Declaração do Problema
[Descreva o problema de negócio ou desafio técnico que motivou esta decisão. Forneça contexto sobre a escala esperada, volumetria e restrições existentes.]

---

## 2. Forças & Requisitos Não-Funcionais (NFRs)
Fatores críticos que influenciam a decisão:
- **Desempenho & Latência:** [ex: P99 < 50ms para 10k req/s]
- **Consistência de Dados (CAP):** [ex: Forte consistência ACID vs. Consistência eventual BASE]
- **Segurança & Conformidade:** [ex: Zero-trust, RBAC/ABAC, auditoria de acesso, LGPD]
- **FinOps & Custo:** [ex: Impacto no custo de instâncias, storage ou licenças cloud]
- **Manutenibilidade & Curva de Aprendizado:** [ex: Padrões dominados pelo time vs. nova tecnologia]

---

## 3. Opções Avaliadas

### Opção 1: [Nome da Opção 1 - ex: Persistência Relacional com SQLite/PostgreSQL]
* **Descrição:** [Como funciona]
* **Prós:**
  * [+] [Vantagem 1]
  * [+] [Vantagem 2]
* **Contras & Limitações:**
  * [-] [Desvantagem 1]
  * [-] [Desvantagem 2]
* **Impacto em FinOps / Custo:** [Estimativa de custo mensal]

### Opção 2: [Nome da Opção 2 - ex: Persistência NoSQL / Document Store]
* **Descrição:** [Como funciona]
* **Prós:**
  * [+] [Vantagem 1]
* **Contras & Limitações:**
  * [-] [Desvantagem 1]
* **Impacto em FinOps / Custo:** [Estimativa de custo mensal]

---

## 4. Decisão Escolhida & Justificativa

**Decidimos adotar a [Opção X: Nome da Solução]** porque [justificativa analítica conectando a escolha às Forças e NFRs do item 2].

### Análise de Trade-offs:
* **O que ganhamos:** [Ganhos primários de arquitetura e velocidade]
* **O que abrimos mão conscientemente:** [Trade-offs aceitos e mitigação planejada]

---

## 5. Consequências & Impactos

### Positivas:
- [Benefício técnico ou operacional garantido]

### Negativas / Riscos Mitigados:
- [Ponto de atenção e como será monitorado ou mitigado]

---

## 6. Critérios de Validação & Conformidade
- [ ] Diagramas C4 atualizados refletindo os novos componentes.
- [ ] Contratos de API / Schemas de banco gerados e versionados.
- [ ] Testes de integração/estresse implementados para validar os SLAs definidos.
