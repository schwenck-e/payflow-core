# Contrato da Tarefa de Alta Precisão (Task Contract)

Todo ticket gerado pelo Agente PM (seja para o **Linear**, **GitHub Issues** ou **Jira**) deve seguir rigorosamente esta estrutura. Este padrão garante que tanto desenvolvedores humanos quanto agentes autônomos de código (ex: Claude Code / HumanLayer) executem sem ambiguidade.

---

### [ID/Tag] [Componente] Título Imperativo da Ação
*Exemplo: `[Backend] Implementar endpoint POST /api/v1/sessions com validação Zod`*

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** [Breve explicação de negócio ou arquitetural]
- **Valor entregue:** [Como isso viabiliza o próximo passo ou resolve uma dor]

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `caminho/para/arquivo_1.ext` (Linhas ou funções relevantes)
  - `caminho/para/arquivo_2.ext`
- **Novos Arquivos a Criar:**
  - `caminho/para/novo_arquivo.ext`
- **Padrões de Referência no Repositório:**
  - Seguir o padrão de context e middleware já existente em `caminho/de/exemplo.ext`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] O comportamento funcional X é observado.
- [ ] O tratamento de erro para os cenários Y e Z retorna status/código adequado.
- [ ] Testes automatizados adicionados em `caminho/para/teste.ext`.
- [ ] Verificações de linters e types passam (`bun run typecheck` / `make check`).

#### 4. Grafo de Dependências
- **Bloqueia:** [ID das tarefas dependentes ou "Nenhuma"]
- **Bloqueado por:** [ID das tarefas pré-requisito ou "Nenhuma"]

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/<id>-<slug>`
- **Comando de Fechamento:** `Fixes <ID>`
