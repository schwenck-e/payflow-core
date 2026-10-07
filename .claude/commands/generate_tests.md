# Qualificação & Engenharia de Testes: Geração Automatizada de Testes (/generate_tests)

Este comando aciona o **`qa_engineer`** para analisar o código recém-implementado ou o plano técnico e gerar suítes completas de testes automatizados seguindo a **Pirâmide de Testes (Unitário, Integração e E2E Playwright)**.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/generate_tests
```
*(ou especificando módulo alvo: `/generate_tests "src/modules/orders"` ou `/generate_tests thoughts/shared/plans/YYYY-MM-DD-ENG-XX-plan.md`)*

---

## 🔍 O que o QA Engineer Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa o Código e o Plano Técnico:**
   - Mapeia rotas expostas, controllers, domain services e schemas Zod.
   - Lê os critérios de aceite e cenários esperados no plano técnico.
2. **Desenha a Matriz de Casos de Teste:**
   - Mapeia o caminho feliz (*Happy Path*).
   - Mapeia casos de borda (*Boundary Value Analysis*): valores máximos, mínimos, zero, listas vazias, concorrência.
   - Mapeia cenários de erro e exceções (falha de autenticação, recurso não encontrado, dados inválidos).
3. **Gera as Suítes de Teste:**
   - **Testes Unitários:** Para funções de negócio e regras de domínio puras (`vitest` / `jest` / `go test`).
   - **Testes de Integração:** Para rotas da API com injeção de dependências, cabeçalhos de autenticação e validação de status HTTP e payloads.
   - **Testes E2E (se houver frontend):** Testes Playwright utilizando Page Object Model (POM) em `tests/e2e/`.
4. **Executa a Suíte de Testes:**
   - Roda os testes recém-gerados (`bun test` ou `npm test`) para garantir que estão passando e não são intermitentes (*flaky*).
5. **Gera o Relatório de Estratégia e Cobertura:**
   - Salva em `thoughts/shared/qa/YYYY-MM-DD-test-strategy.md` (baseado no template `test_strategy_template.md`).
