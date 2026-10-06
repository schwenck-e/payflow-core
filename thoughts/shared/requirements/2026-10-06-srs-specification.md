# 📋 Especificação de Requisitos de Software (SRS / ERS)
### *Padrão ISO/IEC/IEEE 29148 & BABOK*

**Projeto:** PayFlow Core - Gateway de Pagamentos e Ledger Financeiro Imutável  
**Referência do TAP:** `thoughts/shared/governance/2026-10-06-project-charter.md`  
**Analista de Sistemas / Requisitos:** `systems_analyst`  
**Data:** 2026-10-06  
**Versão:** 1.0.0  
**Status:** Homologado / Gate 1  

---

## 📖 1. Visão Geral & Glossário de Domínio

### 1.1 Propósito do Documento
Este documento define os requisitos formais de engenharia de software e as regras de negócio matemáticas e contábeis que sustentam o **PayFlow Core**. Ele atua como o contrato canônico entre concepção, arquitetura, desenvolvimento e testes automatizados.

### 1.2 Glossário de Termos do Domínio (Ubiquitous Language)
| Termo | Definição no Contexto do Negócio |
| :--- | :--- |
| **Merchant** | Entidade comercial/cliente contratante que processa pagamentos através do gateway. |
| **Charge / Cobrança** | Intenção de pagamento gerada pelo merchant com valor, moeda, método de pagamento e cliente pagador. |
| **Double-Entry Ledger** | Sistema contábil de partidas dobradas onde cada evento financeiro resulta em pelo menos um débito e um crédito de mesmo valor total. |
| **Chart of Accounts (Plano de Contas)** | Estrutura hierárquica das contas contábeis organizadas em: Ativos (Assets), Passivos (Liabilities), Patrimônio Líquido (Equity), Receitas (Revenue) e Despesas (Expenses). |
| **Balance Posting / Entry** | Movimentação atômica em uma conta contábil específica indicando valor, direção (DEBIT ou CREDIT) e histórico. |
| **Idempotency Key** | Identificador único emitido pelo cliente para assegurar que chamadas repetidas da mesma mutação não resultem em efeitos colaterais duplicados. |
| **Settlement (Liquidação)** | Transferência financeira de fundos da conta transitória de cobrança para a conta de saldo disponível do merchant. |
| **Minor Units (Centavos)** | Representação inteira de valores monetários (ex: R$ 100,50 = 10050 centavos), prevenindo imperfeições numéricas de ponto flutuante. |

---

## ⚙️ 2. Requisitos Funcionais (RF)

| ID | Nome do Requisito | Descrição Comportamental | Entradas | Processamento | Saídas | Prioridade (MoSCoW) |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **RF-001** | Autenticação de Merchant & API Keys | Autenticar chamadas da API via API Key no cabeçalho `Authorization: Bearer <key>`. | API Key no header | Valida hash SHA-256 da chave no banco, verifica status ativo do merchant. | Contexto do Merchant autenticado | **MUST** |
| **RF-002** | Motor de Idempotência | Garantir que requisições com o header `Idempotency-Key` sejam executadas uma única vez em 24h. | Header `Idempotency-Key`, payload da requisição | Gera hash SHA-256 do payload. Se existir chave idêntica concluída, retorna resposta em cache; se payload divergir, retorna 409 Conflict. | Resposta processada ou replay da resposta em cache | **MUST** |
| **RF-003** | Criação de Cobrança Pix | Criar cobrança via Pix com geração dinâmica de payload EMV (copia-e-cola) e chave de pagamento. | MerchantID, amount_in_cents, currency, customer, pix_key | Valida dados de entrada, registra Charge em status `PENDING`, gera código Pix copia-e-cola. | Charge com ID, status `PENDING`, payload Pix | **MUST** |
| **RF-004** | Criação e Captura de Cobrança por Cartão | Processar cobrança via cartão de crédito com autorização e captura atômica. | MerchantID, amount_in_cents, card (number, holder, exp_month, exp_year, cvv), capture | Valida algoritmo de Luhn, data de expiração, CVV; executa autorização e se capture=true transiciona para `PAID`. | Charge com ID, status (`AUTHORIZED` ou `PAID`), last4 | **MUST** |
| **RF-005** | Criação de Cobrança por Boleto | Emitir cobrança por boleto bancário com linha digitável e código de barras simulado. | MerchantID, amount_in_cents, due_date, customer (nome, documento) | Valida data de vencimento e documento, gera linha digitável e código de barras. | Charge com ID, status `PENDING`, linha digitável | **SHOULD** |
| **RF-006** | Liquidação Contábil de Cobrança | Ao pagar uma cobrança (`PAID`), gerar automaticamente lançamento contábil no Ledger de partidas dobradas. | ChargeID, payment_event | Atualiza status da cobrança para `PAID`, cria `LedgerTransaction` creditando a conta do Merchant e debitando a conta de Clearing/Gateway, abatendo eventuais taxas de processamento (Fee). | Cobrança atualizada e transação contábil vinculada | **MUST** |
| **RF-007** | Estorno de Cobrança (Refund) | Permitir devolução total ou parcial de uma cobrança paga, estornando valores no ledger. | ChargeID, amount_in_cents, reason | Valida que a cobrança está `PAID` e que o total estornado não excede o valor original (RN-05); gera transação contábil reversa no Ledger. | Refund criado com ID, status `REFUNDED` ou `PARTIALLY_REFUNDED` | **MUST** |
| **RF-008** | Gestão do Plano de Contas | Permitir criação e consulta de contas contábeis vinculadas ao merchant e à plataforma. | code, name, type (`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`), currency | Valida tipagem contábil e unicidade do código de conta por merchant. | Conta contábil criada com ID e saldo inicial 0 | **MUST** |
| **RF-009** | Lançamentos de Partidas Dobradas no Ledger | Registrar transações contábeis compostas por múltiplos lançamentos (Entries) com validação estrita $\sum \text{Debit} = \sum \text{Credit}$. | transaction_type, description, entries[] (account_id, direction, amount_in_cents) | Valida se soma dos débitos é igual à soma dos créditos (RN-01), atualiza saldos de forma atômica e registra auditoria imutável (RN-02). | Transação do Ledger confirmada com entries gravadas | **MUST** |
| **RF-010** | Consulta de Saldos e Extrato do Ledger | Disponibilizar consulta de saldo atualizado de contas contábeis e histórico detalhado de movimentações. | account_id, filtros de data e paginação | Agrega lançamentos da conta ou lê saldo snapshot sincronizado. | Saldo consolidado (`balance_in_cents`) e lista de lançamentos | **MUST** |
| **RF-011** | Disparo de Webhooks Assinados | Notificar URLs de callback configuradas pelos merchants sobre eventos do ciclo de pagamento. | event_type, payload, webhook_secret | Monta envelope de evento, calcula assinatura HMAC-SHA256 (`X-Payflow-Signature`) e dispara requisição HTTP. | Notificação enviada com status de entrega e log | **MUST** |
| **RF-012** | Monitoramento de Saúde & Telemetria | Fornecer endpoints padrão para verificação de liveness e readiness da aplicação. | Requisição GET | Checa conectividade com banco de dados e estado do processo. | HTTP 200 OK com payload `{ status: "ok", timestamp: ... }` | **MUST** |

---

## 🛡️ 3. Requisitos Não-Funcionais (RNF)

| ID | Categoria | Declaração do Requisito | Métrica Mensurável / Alvo |
| :--- | :--- | :--- | :--- |
| **RNF-001** | **Performance** | Latência de processamento de cobranças e lançamentos contábeis ultrarrápida. | $\le 40\text{ms}$ (p95) para transações do Ledger e $\le 100\text{ms}$ (p95) para charges sob 1.000 req/s. |
| **RNF-002** | **Consistência Contábil** | Integridade matemática absoluta nos balanços e partidas dobradas (ACID). | 100% dos lançamentos contábeis com $\sum \text{Debits} == \sum \text{Credits}$. Zero divergência de centavos. |
| **RNF-003** | **Idempotência Determinística** | Proteção absoluta contra cobranças duplicadas em conexões instáveis. | 100% de replay com chave idêntica dentro de 24h sem gerar novos débitos. |
| **RNF-004** | **Imutabilidade de Registros** | Lançamentos do Ledger devem ser estritamente *append-only*. | Zero `UPDATE` ou `DELETE` em tabelas contábeis. Proibição enforced em aplicação e triggers. |
| **RNF-005** | **Representação Monetária** | Eliminação de erros de arredondamento de ponto flutuante IEEE 754. | 100% das operações monetárias em inteiros de centavos (`amount_in_cents` ou `bigint`). |
| **RNF-006** | **Segurança & Criptografia** | Proteção de credenciais e dados em trânsito e repouso. | Hash SHA-256 para API Keys, HMAC-SHA256 para webhooks, TLS 1.3 obrigatório e mascaramento de cartões (last4). |
| **RNF-007** | **Confiabilidade & Disponibilidade**| Uptime operacional contínuo da API de pagamentos. | SLA $\ge 99.95\%$ de disponibilidade anual. |

---

## ⚖️ 4. Catálogo de Regras de Negócio (RN)

- **`RN-001 (Invariante Contábil de Partidas Dobradas):`**  
  Em toda e qualquer transação contábil (`LedgerTransaction`), a soma aritmética de todas as entradas de débito (`DEBIT`) deve ser estritamente igual à soma de todas as entradas de crédito (`CREDIT`):
  $$\sum \text{amount}(\text{entries}_{\text{DEBIT}}) = \sum \text{amount}(\text{entries}_{\text{CREDIT}})$$
  Se a diferença for diferente de 0, a transação deve ser abortada imediatamente com o erro de domínio `LEDGER_UNBALANCED_TRANSACTION`.

- **`RN-002 (Imutabilidade Absoluta do Ledger):`**  
  Nenhum registro da tabela `LedgerTransaction` ou `LedgerEntry` pode sofrer alterações (`UPDATE`) ou remoções (`DELETE`) após sua criação. Correções operacionais ou contábeis exigem obrigatoriamente a criação de um novo lançamento reverso (*reversal posting*) que anule a transação original mantendo o rastro histórico inalterado.

- **`RN-003 (Idempotência por Chave e Verificação de Hash):`**  
  Requisições que enviam o cabeçalho `Idempotency-Key` devem ter o hash SHA-256 do payload validado.  
  - Caso a chave exista para o mesmo merchant e o hash coincida: retornar a resposta original em cache com status HTTP original e cabeçalho `X-Cache-Lookup: HIT`.  
  - Caso a chave exista para o mesmo merchant mas o hash do payload seja diferente: retornar `HTTP 409 Conflict` com código `IDEMPOTENCY_PAYLOAD_MISMATCH`.  
  - O bloqueio em processamento transitório (*in-flight lock*) impede que duas requisições com a mesma chave sejam executadas paralelamente no mesmo milissegundo.

- **`RN-004 (Prevenção de Saldo Negativo em Carteiras de Merchant):`**  
  Contas de passivo que representam saldos disponíveis de merchants (`LIABILITY:MERCHANT_WALLET`) não podem atingir saldo consolidado inferior a zero em liquidações ou transferências, a não ser que a conta possua a configuração explícita `allow_overdraft: true`.

- **`RN-005 (Limite Acumulado de Estorno):`**  
  O somatório dos valores de todos os estornos parciais ou totais vinculados a uma cobrança não pode em hipótese alguma ultrapassar o valor líquido original da cobrança (`total_refunded <= original_charge_amount`). Tentativas de estorno acima do saldo disponível da cobrança são rejeitadas com `REFUND_EXCEEDS_CHARGE_AMOUNT`.

- **`RN-006 (Consistência de Moeda):`**  
  Todas as contas e entradas participantes de uma mesma transação do ledger devem compartilhar a mesma moeda padrão (ex: `BRL`). Conversões cambiais exigem par de transações intermediadas por conta de câmbio (*FX Clearing Account*).

---

## 📊 5. Critérios de Homologação da Especificação
- [x] Todos os 12 Requisitos Funcionais devidamente mapeados com priorização MoSCoW.
- [x] Todos os 7 Requisitos Não-Funcionais quantificados com métricas numéricas.
- [x] Todas as 6 Regras de Negócio fundamentadas com lógica formal e tratativas de erro.
- [x] Aprovado pelo Systems Analyst para a modelagem UML e concepção arquitetural.
