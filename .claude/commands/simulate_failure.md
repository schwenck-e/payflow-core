# Arquitetura Sistêmica: Simulação de Falhas & Engenharia de Caos (/simulate_failure)

Este comando conduz uma simulação controlada de falhas sistêmicas (Engenharia de Caos) para testar a resiliência, tolerância a desastres e blast radius (raio de destruição) da arquitetura antes do go-live.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/simulate_failure
```
*(ou injetando falha específica: `/simulate_failure "Queda do banco de dados relacional durante checkout de OS"`)*

---

## 🔍 O que o System Architect Executa

Ao ser acionado, o agente:
1. **Identifica os Componentes Críticos e Dependências:** Mapeia bancos de dados, brokers de mensageria (Redis, RabbitMQ, Kafka), APIs externas e gateways de pagamento/autenticação.
2. **Injeta Hipóteses de Falha:**
   - Queda abrupta de banco de dados ou conexão recusada.
   - Partição de rede e inacessibilidade da fila/mensageria.
   - Rate limit HTTP 429 ou latência excessiva (> 10s) em provedores de LLM ou APIs de terceiros.
3. **Avalia os Mecanismos de Tolerância:**
   - Verifica presença de **Outbox Pattern** para evitar perda de mensagens assíncronas.
   - Verifica comportamento de **Circuit Breaker** para evitar efeito dominó.
   - Confere se há retries com Exponential Backoff e Jitter e Dead Letter Queues (DLQ).
4. **Calcula o Blast Radius:** Delimita se a falha derruba o sistema por completo ou se o sistema opera em modo de degradação graciosa (Graceful Degradation).
5. **Gera o Relatório de Resiliência:**
   - Salva em `thoughts/shared/architecture/simulations/YYYY-MM-DD-chaos-and-resilience-simulation.md` (baseado no template `chaos_resilience_template.md`).
