# Engenharia de Requisitos: Termo de Abertura de Projeto (/project_charter)

Este comando aciona o **`systems_analyst`** para estruturar o **Termo de Abertura de Projeto (TAP / Project Charter)**, alinhando a justificativa estratégica, objetivos SMART, patrocinador executivo, premissas, restrições e limites de escopo (In-Scope vs Out-of-Scope).

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/project_charter
```
*(ou especificando a iniciativa: `/project_charter "Sistema de Gestão de Ordens de Serviço (ordem-servico-app)"`)*

---

## 🔍 O que o Systems Analyst Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa a Demanda e Contexto de Negócio:**
   - Elicita o problema a ser resolvido, os usuários afetados e o valor esperado (ROI).
   - Define objetivos SMART específicos e quantificáveis.
2. **Delimita Rigorosamente o Escopo:**
   - Define o **In-Scope** (módulos e funcionalidades entregues na versão).
   - Define o **Out-of-Scope** (limites explícitos para evitar inchaço de escopo / *Scope Creep*).
3. **Mapeia a Governança e Matriz RACI:**
   - Identifica os stakeholders-chave e preenche a matriz de responsabilidades (R, A, C, I).
4. **Preenche o Template Canônico:**
   - Baseado no template `thoughts/shared/templates/project_charter_template.md`.
   - Salva o documento oficial em `thoughts/shared/governance/YYYY-MM-DD-project-charter.md`.
5. **Solicita a Homologação do Sponsor:**
   - Apresenta o resumo executivo no chat para aprovação do líder de engenharia.
