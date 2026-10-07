# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-50] [Backend] Construir Despachador de Webhooks com Assinatura HMAC-SHA256

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** Merchants integram suas plataformas de e-commerce e ERPs com o PayFlow Core e dependem de notificações imediatas e confiáveis sobre eventos de pagamentos (`charge.created`, `charge.paid`, `charge.refunded`). Para garantir autenticidade, integridade e prevenir ataques de homem-do-meio (MITM) ou falsificação de eventos, as notificações devem ser assinadas criptograficamente com HMAC-SHA256.
- **Valor entregue:** Despacha eventos HTTP assíncronos para as URLs cadastradas dos merchants com a assinatura segura no cabeçalho `X-Payflow-Signature`, permitindo ao merchant validar a origem utilizando seu `webhookSecret`. Atende aos requisitos RF-011 e RNF-006.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/infrastructure/security/hash.ts` (Implementar função `hmacSha256` utilizando `crypto.createHmac` com comparação em tempo constante)
  - `src/domain/services/webhook.service.ts` (Implementar classe `WebhookService`, métodos `dispatchWebhook` e `signPayload` tratando timeouts e falhas de transporte)
- **Novos Arquivos a Criar:**
  - `tests/unit/webhook.service.test.ts` (Testes unitários cobrindo cálculo correto da assinatura HMAC-SHA256, cabeçalhos HTTP gerados e resiliência a falhas de rede)
- **Padrões de Referência no Repositório:**
  - `src/domain/services/payment.service.ts` (Invocação assíncrona do despachador nos eventos de ciclo de vida de cobrança).
  - Caso de uso formal UC-008 documentado em `thoughts/shared/analysis/use_cases/2026-10-06-core-use-cases.md`.

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Todo webhook despachado inclui o cabeçalho `X-Payflow-Signature` contendo a assinatura hexadecimal HMAC-SHA256 gerada a partir do payload canônico e do segredo do merchant (RNF-006, RF-011).
- [ ] Cabeçalho `X-Payflow-Event` e `Content-Type: application/json` são enviados em todas as requisições de webhook.
- [ ] Falhas transitórias ou erros HTTP retornados pelo endpoint do merchant são capturados e logados sem quebrar o fluxo principal de processamento de pagamentos.
- [ ] Testes unitários em `tests/unit/webhook.service.test.ts` executam com 100% de sucesso via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-51, ENG-52
- **Bloqueado por:** ENG-45, ENG-48

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-50-webhook-dispatcher-hmac`
- **Comando de Fechamento:** `Fixes ENG-50`
