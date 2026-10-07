# Modelagem de Sistemas: Diagramas e Especificação de Casos de Uso (/model_use_cases)

Este comando aciona o **`systems_analyst`** para modelar o diagrama geral de Casos de Uso (UML 2.5) e especificar detalhadamente os fluxos de interação (Happy Path, fluxos alternativos e fluxos de exceção).

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/model_use_cases
```
*(ou apontando para o SRS existente: `/model_use_cases thoughts/shared/requirements/YYYY-MM-DD-srs-specification.md`)*

---

## 🔍 O que o Systems Analyst Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa os Requisitos Funcionais do SRS:**
   - Mapeia os atores primários e secundários que interagem com o sistema.
   - Agrupa requisitos em casos de uso coesos com relações `<<include>>` e `<<extend>>`.
2. **Gera o Diagrama Geral de Casos de Uso em Mermaid:**
   - Renderiza a fronteira do sistema, atores externos e casos de uso associados.
3. **Redige as Especificações Detalhadas de Cada Caso de Uso:**
   - Ator Primário, Pré-condições, Pós-condições (Garantias de Sucesso).
   - **Fluxo Principal (Happy Path)** numerado passo a passo.
   - **Fluxos Alternativos** (ex: caminhos de atalho, novos cadastros).
   - **Fluxos de Exceção** (ex: violações de regras de negócio, falhas de conectividade, acessos negados).
4. **Preenche o Template Canônico:**
   - Baseado no template `thoughts/shared/templates/use_case_specification_template.md`.
   - Salva em `thoughts/shared/analysis/use_cases/YYYY-MM-DD-use-cases.md`.
