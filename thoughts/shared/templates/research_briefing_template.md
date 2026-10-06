# Template: Briefing de Pesquisa de Codebase (PM -> Research Agent)

Este documento padroniza a consulta técnica emitida pelo Agente PM para o `humanlayer_research_codebase`.

---

## 1. Contexto do Requisito
- **Iniciativa / Objetivo:** [Descrever o que o usuário quer em alto nível]
- **Camadas Envolvidas:** [Backend (Go/hld), Frontend (React/WUI), CLI (hlyr), etc.]

## 2. Perguntas-Chave de Investigação Técnica
1. **Reaproveitamento de Código:**
   - Já existem tipos, interfaces ou utilitários que resolvem parte dessa necessidade?
   - Quais arquivos existentes devem ser estendidos em vez de recriados?
2. **Raio de Explosão (Blast Radius):**
   - Se adicionarmos/modificarmos esses métodos ou rotas, quais outros módulos ou clientes serão afetados?
   - Há impacto em persistência de dados (migrations, schemas SQLite/Prisma)?
3. **Padrões de Teste e Qualidade:**
   - Quais suites de testes cobrem essa área atualmente (`go test`, `bun test`, `vitest`)?
   - Onde estão os mocks ou fixtures utilizados nesses testes?

## 3. Saída Esperada do Agente de Pesquisa
- Lista exata de arquivos existentes a serem modificados.
- Lista de novos arquivos a serem criados (com padrão de nomenclatura e diretório).
- Risco técnico identificado (baixo/médio/alto) e sugestão de fatiamento.
