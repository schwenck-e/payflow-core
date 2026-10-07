# DevOps & SRE: Publicação em Produção e Gestão de Release (/deploy_release)

Este comando aciona o **`devops_sre`** para conduzir a esteira de publicação em produção com zero downtime: checagem de gates de qualidade, validação de migrations, bump de versão semântica, geração de changelog, criação do Runbook Operacional e emissão de Git Tag.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/deploy_release
```
*(ou especificando versão/alvo: `/deploy_release "v1.2.0" ou "/deploy_release minor"`)*

---

## 🔍 O que o DevOps & SRE Agent Executa Autonomamente

Ao ser acionado, o agente:
1. **Auditoria Pré-Deploy (Quality & Security Check):**
   - Verifica se a branch atual é a `main` e se a árvore de trabalho do Git está limpa.
   - Executa a validação estática de conformidade (`make check-arch` ou `bun scripts/arch_lint.ts`).
   - Garante que a suíte de testes (`bun test`) e a auditoria de segurança (`security_audit`) estão 100% aprovadas.
2. **Validação de Migrações de Banco de Dados:**
   - Inspeciona se há migrações pendentes.
   - Valida se as alterações de schema seguem o padrão *Expand/Contract* (não-destrutivas, compatíveis com a versão anterior do código).
3. **Versionamento Semântico e Changelog:**
   - Calcula o próximo número de versão (`major`, `minor`, `patch`) com base nos commits e tickets do Linear (`ENG-XX`).
   - Atualiza `package.json` ou arquivo de versão do projeto.
   - Compila o changelog formatado categorizando Features, Fixes e Breaking Changes.
4. **Geração do Runbook Operacional de Produção:**
   - Preenche o template `thoughts/shared/templates/runbook_template.md`.
   - Documenta a matriz de monitoramento, procedimentos de rollback com triggers automáticos e scripts de verificação pós-deploy.
   - Salva em `thoughts/shared/runbooks/YYYY-MM-DD-vX.Y.Z-release-runbook.md`.
5. **Criação da Git Tag e Disparo de CI/CD:**
   - Cria a tag de release anotada (`git tag -a vX.Y.Z -m "Release vX.Y.Z"`).
   - Executa `git push origin main --tags`, disparando a pipeline de deploy do GitHub Actions.
6. **Smoke Testing Pós-Deploy:**
   - Executa testes de fumaça contra as rotas de liveness (`/health/liveness`) e readiness (`/health/readiness`) para atestar zero downtime.
