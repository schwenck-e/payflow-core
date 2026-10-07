# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-52] [QA] Estruturar Pirâmide de Testes Automatizados e Auditoria OWASP Top 10

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** Como infraestrutura crítica de pagamentos e registros contábeis, o PayFlow Core não tolera regressões funcionais, falhas de arredondamento monetário ou brechas de segurança. É essencial consolidar uma pirâmide completa de testes automatizados (unitários de domínio e integrados de API) e realizar auditoria estática de segurança (SAST) orientada ao OWASP Top 10 para subsidiar o Gate 2 de aprovação.
- **Valor entregue:** Assegura que 100% dos requisitos funcionais (RF-001 a RF-012) e não-funcionais (RNF-001 a RNF-007) possuam evidências automatizadas de teste com zero regressão, garantindo conformidade com a Matriz de Rastreabilidade de Requisitos (RTM) e laudo de segurança com 0 vulnerabilidades críticas/altas.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `tests/unit/idempotency.service.test.ts` (Testes unitários de idempotência)
  - `tests/unit/webhook.service.test.ts` (Testes unitários de webhook HMAC)
  - `tests/unit/account.entity.test.ts` (Testes unitários de regras de saldo)
  - `tests/unit/money.vo.test.ts` (Testes unitários de manipulação de centavos)
  - `tests/unit/ledger-double-entry.test.ts` (Testes unitários de partidas dobradas e invariante contábil)
  - `tests/integration/payment-flow.test.ts` (Testes de integração do fluxo de pagamento completo)
  - `tests/integration/refund-flow.test.ts` (Testes de integração do fluxo de estornos parciais e totais)
  - `tests/integration/health.test.ts` (Testes de integração dos probes de liveness e readiness)
- **Novos Arquivos a Criar:**
  - `thoughts/shared/qa/2026-10-06-test-strategy.md` (Documento de estratégia de testes e critérios de cobertura)
  - `thoughts/shared/qa/2026-10-06-security-audit.md` (Laudo formal de auditoria SAST contra os 10 itens OWASP)
- **Padrões de Referência no Repositório:**
  - Matriz RTM em `thoughts/shared/requirements/2026-10-06-requirements-traceability-matrix.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Todos os 19 testes automatizados distribuídos entre unitários e integração executam com 100% de sucesso via `bun test`.
- [ ] Cobertura de testes valida as regras de negócio centrais: RN-001 (partidas dobradas), RN-002 (imutabilidade), RN-003 (idempotência), RN-004 (saldo negativo) e RN-005 (limite de estorno).
- [ ] Laudo de auditoria SAST documentado com verificação explícita dos 10 itens do OWASP Top 10 apresentando 0 vulnerabilidades impeditivas.
- [ ] Script de medição de cobertura `bun run test:coverage` executa sem falhas.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-53
- **Bloqueado por:** ENG-48, ENG-49, ENG-50, ENG-51

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-52-qa-test-pyramid-sast-audit`
- **Comando de Fechamento:** `Fixes ENG-52`
