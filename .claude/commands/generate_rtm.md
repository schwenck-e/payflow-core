# Governança de Requisitos: Matriz de Rastreabilidade (/generate_rtm)

Este comando aciona o **`systems_analyst`** para compilar e auditar a **Matriz de Rastreabilidade de Requisitos (RTM - Requirements Traceability Matrix)**, garantindo conexão bidirecional: Requisito ➔ Caso de Uso ➔ Ticket Linear ➔ Código Fonte ➔ Teste Automatizado.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/generate_rtm
```
*(ou auditando módulo específico: `/generate_rtm "src/modules/orders"`)*

---

## 🔍 O que o Systems Analyst Executa Autonomamente

Ao ser acionado, o agente:
1. **Lê os Requisitos do SRS e os Casos de Uso:**
   - Extrai a lista completa de IDs formais (`RF-001..RF-NNN`, `RNF-001..RNF-NNN`).
2. **Cruza com o Backlog no Linear:**
   - Mapeia qual ticket do Linear (`ENG-XX`) implementa cada requisito.
3. **Inspeciona a Árvore de Código-Fonte Git:**
   - Localiza os arquivos de controller, use case, domain service e migrations responsáveis.
4. **Verifica as Suítes de Testes Automatizados:**
   - Cruza cada cenário de teste com a respectiva regra de negócio (`RN-XX`) e requisito funcional.
5. **Emite o Diagnóstico de Rastreabilidade (Zero Lacunas):**
   - Identifica **Requisitos Órfãos:** Requisitos especificados que não possuem código ou testes correspondentes.
   - Identifica **Escopo Fantasma (*Gold Plating*):** Código implementado sem nenhum requisito formal que o fundamente.
6. **Gera a Matriz Oficial:**
   - Preenche o template `thoughts/shared/templates/rtm_matrix_template.md`.
   - Salva em `thoughts/shared/requirements/YYYY-MM-DD-requirements-traceability-matrix.md`.
