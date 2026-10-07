# Engenharia de Requisitos: Especificação de Requisitos de Software (/elicit_requirements)

Este comando aciona o **`systems_analyst`** para elicitar, catalogar e formalizar a Especificação de Requisitos de Software (SRS / ERS) conforme os padrões **ISO/IEC/IEEE 29148** e **BABOK**, definindo Requisitos Funcionais (RF), Não-Funcionais (RNF) e o Catálogo de Regras de Negócio (RN-XX).

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/elicit_requirements
```
*(ou apontando para o TAP existente: `/elicit_requirements thoughts/shared/governance/YYYY-MM-DD-project-charter.md`)*

---

## 🔍 O que o Systems Analyst Executa Autonomamente

Ao ser acionado, o agente:
1. **Lê o Termo de Abertura e Declaração de Escopo:**
   - Inspeciona os limites do projeto para garantir conformidade com o acordado no TAP.
2. **Elicita os Requisitos Funcionais (RF-001..RF-NNN):**
   - Especifica cada requisito com ID, nome, descrição comportamental, entradas, processamento e saídas.
   - Aplica a priorização MoSCoW (Must, Should, Could, Won't).
3. **Define os Requisitos Não-Funcionais Mensuráveis (RNF-001..RNF-NNN):**
   - Especifica metas quantificáveis de Performance (p95 latency), Disponibilidade (SLA 99.9%), Segurança (bcrypt, JWT, TLS 1.3), Escalabilidade e Acessibilidade (WCAG AAA).
4. **Cataloga as Regras de Negócio Inegociáveis (RN-001..RN-NNN):**
   - Desacopla regras de negócio puras de detalhes de infraestrutura ou banco de dados.
5. **Gera a Especificação Oficial:**
   - Preenche o template `thoughts/shared/templates/srs_requirements_template.md`.
   - Salva em `thoughts/shared/requirements/YYYY-MM-DD-srs-specification.md`.
