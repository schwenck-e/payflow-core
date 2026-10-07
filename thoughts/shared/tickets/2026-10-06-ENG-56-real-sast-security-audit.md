# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-56] [DevOps] Integrar Ferramenta Real de SAST e Auditoria Contínua de Dependências na Pipeline CI

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** O relatório de auditoria de segurança atual (`thoughts/shared/qa/2026-10-06-security-audit.md`) foi elaborado de forma qualitativa e declarativa. Para que a governança de AppSec atinja maturidade de produção e atenda plenamente ao RNF-006, é imperativo incorporar ferramentas reais e automatizadas de SAST (Static Application Security Testing) e varredura de vulnerabilidades de dependências (CVEs) tanto em scripts executáveis locais quanto na pipeline de integração contínua do GitHub Actions.
- **Valor entregue:** Garante verificação estática contínua contra vetores do OWASP Top 10 (injeção de código, segredos expostos em texto claro, dependências vulneráveis) que bloqueia automaticamente pull requests em caso de falha de segurança, eliminando riscos de falsos negativos manuais.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `package.json` (Adicionar scripts de automação de segurança `audit:security` e `sast` executando checagem de vulnerabilidades em dependências e análise de código)
  - `.github/workflows/ci.yml` (Adicionar job dedicado de `security-audit` na pipeline de CI executando a checagem automatizada)
  - `thoughts/shared/qa/2026-10-06-security-audit.md` (Atualizar o laudo com a saída e evidências das ferramentas automatizadas)
- **Novos Arquivos a Criar:**
  - `scripts/security_audit.ts` (Script executável que audita padrões sensíveis de código, regex de segredos e invoca auditoria de pacotes)
- **Padrões de Referência no Repositório:**
  - `scripts/arch_lint.ts` (Referência de script TypeScript executado via Bun para validações estáticas)
  - `.github/workflows/ci.yml` (Estrutura de workflow existente)

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Script de auditoria de segurança funcional configurado e executável via `bun run audit:security`.
- [ ] Job de segurança adicionado em `.github/workflows/ci.yml` falhando imediatamente a esteira se vulnerabilidades com severidade Alta ou Crítica forem encontradas.
- [ ] Varredura SAST sobre `src/` confirma 0 ocorrências de segredos hardcoded, injeção SQL direta (`$queryRawUnsafe`) ou vazamento de dados sensíveis de cartão (PAN/CVV).
- [ ] Relatório `thoughts/shared/qa/2026-10-06-security-audit.md` atualizado com as evidências das ferramentas automatizadas e parecer aprovado.
- [ ] Verificações de linters e types passam (`bun run typecheck`, `bun run check-arch`).

#### 4. Grafo de Dependências
- **Bloqueia:** Nenhuma (Requisito para Gate 2 / Release final)
- **Bloqueado por:** ENG-53

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-56-real-sast-security-audit`
- **Comando de Fechamento:** `Fixes ENG-56`
