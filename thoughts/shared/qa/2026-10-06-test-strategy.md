# 🧪 Estratégia Canônica de Testes & Qualidade de Software

- **Projeto / Subsistema:** `payflow-core` (Payment Gateway & Double-Entry Ledger)
- **Data da Estratégia:** `2026-10-06`
- **QA & AppSec Engineer:** `qa_engineer`
- **Requisitos do Produto:** `thoughts/shared/plans/2026-10-06-payflow-core-prd.md`
- **Modelo Arquitetural:** `thoughts/shared/architecture/2026-10-06-payflow-core-architecture.md`
- **Status:** 100% Executado e Aprovado ✅ (19/19 testes passando)

---

## 1. Distribuição da Pirâmide de Testes

```
                   ▲
                  / \
                 /E2E\       15% Testes de Integração com Fastify Injection e Banco Real
                /─────\
               / Integ \     25% Testes de Serviços, Idempotência e Reversão Contábil
              /─────────\
             /  Unitário \   60% Testes Unitários de Regras de Domínio, Invariantes (RN-001) e MoneyVO
            /─────────────\
```

---

## 2. Metas de Cobertura e Resultados Obtidos

| Nível de Teste | Alvo de Cobertura | Ferramentas | Foco de Validação | Status Atual |
| :--- | :--- | :--- | :--- | :---: |
| **Unitário** | ≥ 90% Branches | Bun Test | Invariante contábil $\sum D == \sum C$ (RN-001), Minor units sem float IEEE 754, overdraft protection (RN-004) e HMAC-SHA256 | ✅ 100% Pass |
| **Integração** | 100% Rotas | Bun Test + Fastify Inject | Criação de cobranças Pix/Cartão, reconciliação automática no Ledger, estornos parciais e limites acumulados (RN-005) | ✅ 100% Pass |
| **Probes / SRE** | 100% Health Probes | Bun Test | `/health/liveness` e `/health/readiness` com checagem de banco de dados | ✅ 100% Pass |

---

## 3. Matriz de Cenários de Teste Executados

| Módulo / Domínio | Cenário Nominal (Happy Path) | Cenários de Borda (Edge Cases) | Cenários Negativos / Erro |
| :--- | :--- | :--- | :--- |
| **Money Value Object** | Conversão de centavos e strings decimais | Alocação de centavos residuais sem sobras | Rejeição de moedas diferentes (`InvalidCurrencyError`) |
| **Double-Entry Ledger** | Criação de lançamentos com $\sum D == \sum C$ | Transações com múltiplos débitos e créditos | Rejeição imediata de diferença de 1 centavo (`UnbalancedLedgerError`) |
| **Account & Overdraft** | Débitos e créditos em Ativos e Passivos | Saldo exatamente zero na conta | Rejeição de saldo negativo quando `allowOverdraft: false` (RN-004) |
| **Motor de Idempotência** | Execução única com gravação de resposta | Replay de resposta em cache (`X-Cache-Lookup: HIT`) | Rejeição por divergência de payload na mesma chave (`IDEMPOTENCY_PAYLOAD_MISMATCH`) |
| **Gateway de Pagamento** | Cobrança Cartão autorizada e capturada | Geração de payload Pix EMV dinâmico | Rejeição de cartão inválido pelo algoritmo de Luhn (400) |
| **Estorno & Reversão** | Estorno parcial com contrapartida simétrica no Ledger | Estorno consecutivo até 100% do valor da cobrança | Rejeição de estorno maior que o valor disponível (`REFUND_EXCEEDS_CHARGE_AMOUNT`) |

---

## 4. Gestão de Isolamento de Dados
1. **Banco Isolado de Teste:** Testes executados contra SQLite com recriação atômica e seed limpo.
2. **Deterministic Seed:** Contas contábeis canônicas (`1.1.01.001`, `2.1.01.001`, `4.1.01.001`) provisionadas deterministicamente.
3. **Limpeza de Chaves:** Limpeza prévia de registros de idempotência por suíte de teste.

---

## 5. Laudo Final do Quality Gate
- **Total de Testes:** 19
- **Sucessos:** 19 (100%)
- **Falhas / Flaky Tests:** 0
- **Tempo de Execução:** ~2.3 segundos
