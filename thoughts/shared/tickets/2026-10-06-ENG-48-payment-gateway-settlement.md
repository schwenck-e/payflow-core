# Contrato da Tarefa de Alta Precisão (Task Contract)

### [ENG-48] [Backend] Implementar Gateway de Pagamentos e Liquidação Contábil

#### 1. Contexto & Motivação
- **Por que estamos fazendo isso:** O PayFlow Core precisa processar pagamentos nos três métodos mais relevantes do mercado brasileiro: Pix, Cartão de Crédito e Boleto Bancário. Para assegurar confiabilidade de nível bancário, cada pagamento liquidado deve disparar atomicamente uma transação contábil de partidas dobradas no Ledger, garantindo que o dinheiro transacionado seja creditado na carteira do merchant e debitado na conta clearing da plataforma.
- **Valor entregue:** Orquestra a captura e autorização de pagamentos com liquidação imediata em ledger (RN-001, RN-006), geração de payload EMV no Pix, validação algorítmica de cartões via algoritmo de Luhn com mascaramento e geração de linha digitável para boletos. Atende aos requisitos RF-003, RF-004, RF-005, RF-006 e RNF-001.

#### 2. Âncoras de Código (Codebase Anchors)
*Evidências extraídas via pesquisa prévia de codebase:*
- **Arquivos Primários a Modificar:**
  - `src/domain/entities/charge.entity.ts` (Implementar máquina de estados da cobrança: PENDING, PAID, FAILED, REFUNDED, com validações de transição)
  - `src/domain/services/payment.service.ts` (Implementar método `createCharge` orquestrando validação, geração de dados do método de pagamento e postagem no `LedgerService`)
- **Novos Arquivos a Criar:**
  - `tests/integration/payment-flow.test.ts` (Testes de integração ponta a ponta validando fluxo de cobrança Pix, Cartão de Crédito e Boleto com postagem contábil no Ledger)
- **Padrões de Referência no Repositório:**
  - `src/domain/services/ledger.service.ts` (Método `postTransaction` com `TransactionType.PAYMENT_SETTLEMENT`).
  - `src/domain/value-objects/money.vo.ts` (Manipulação estrita de centavos).
  - Casos de uso documentados em `thoughts/shared/analysis/use_cases/2026-10-06-core-use-cases.md` (UC-002 e UC-003).

#### 3. Critérios de Aceite (Definition of Done)
*Checklist verificável e binário:*
- [ ] Cobrança Pix gera chave cópia-e-cola e payload em formato compatível com o padrão EMV (RF-003).
- [ ] Cobrança de Cartão de Crédito valida o número do cartão utilizando o algoritmo de Luhn e persiste apenas `cardLast4` e `cardBrand`, sem texto claro ou CVV (RF-004, RNF-006).
- [ ] Cobrança Boleto Bancário gera código de barras e linha digitável padronizada (RF-005).
- [ ] Toda cobrança liquidada gera obrigatoriamente um registro em `LedgerTransaction` com duas entradas balanceadas: DÉBITO na conta de Clearing e CRÉDITO na conta do Merchant ($\sum D = \sum C$, RN-001, RF-006).
- [ ] Operação inteira de persistência da cobrança e das partidas do ledger é transacional e atômica.
- [ ] Testes de integração em `tests/integration/payment-flow.test.ts` executam com 100% de sucesso via `bun test`.
- [ ] Verificações de linters e types passam (`bun run typecheck`).

#### 4. Grafo de Dependências
- **Bloqueia:** ENG-49, ENG-51, ENG-52, ENG-55
- **Bloqueado por:** ENG-45, ENG-46, ENG-47

#### 5. Rastreabilidade
- **PR Alvo / Branch:** `feature/ENG-48-payment-gateway-settlement`
- **Comando de Fechamento:** `Fixes ENG-48`
