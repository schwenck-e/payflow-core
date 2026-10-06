# 📈 Simulação de Carga, Dimensionamento de Capacidade & FinOps: PayFlow Core

- **Sistema / Subsistema:** `payflow-core` (Payment Gateway & Double-Entry Ledger)
- **Data da Simulação:** `2026-10-06`
- **Arquiteto Responsável:** `system_architect`
- **Modelo Arquitetural de Referência:** `thoughts/shared/architecture/2026-10-06-payflow-core-architecture.md`
- **Ambiente Alvo:** AWS ECS Fargate / GCP Cloud Run / Kubernetes / Local Docker

---

## 1. Perfil de Tráfego Estimado

| Métrica de Demanda | Cenário Nominal (Dia a Dia) | Cenário de Pico (Black Friday / Promoções) | Fator de Sobrecarga |
| :--- | :--- | :--- | :--- |
| **Merchants Ativos** | 500 estabelecimentos | 5.000 estabelecimentos | 10x |
| **Requisições por Segundo (RPS)** | 150 req/s | 2.500 req/s | 16.6x |
| **Throughput de Transações de Ledger (WPS)** | 50 tx/s (150 entries/s) | 1.000 tx/s (3.000 entries/s) | 20x |
| **Throughput de Leitura de Saldo / Extratos** | 100 req/s | 1.500 req/s | 15x |
| **Latência Alvo p95** | $\le 25\text{ms}$ | $\le 50\text{ms}$ | Conforme SLO |

---

## 2. Dimensionamento da Camada de Aplicação (Compute)

| Recurso | Configuração Mínima (Nominal) | Configuração Escalada (Pico) | Política de Auto-Scaling |
| :--- | :--- | :--- | :--- |
| **Instâncias / Containers** | 2 réplicas (HA Mínimo) | 10 réplicas | CPU > 65% ou RPS > 300/pod |
| **CPU por Instância** | 0.5 vCPU | 1.0 vCPU | - |
| **Memória RAM por Instância** | 512 MB | 1024 MB | Memory > 75% |
| **Concorrência por Processo Fastify** | 250 conexões simultâneas | 500 conexões simultâneas | Event loop monitorado |

---

## 3. Dimensionamento do Banco de Dados & Connection Pool

```
┌────────────────────────────────────────────────────────┐
│               CÁLCULO DO CONNECTION POOL               │
├────────────────────────────────────────────────────────┤
│ Total Pods = 10 pods em pico                           │
│ Pool por Pod = 12 conexões                             │
│ Conexões Ativas em Pico = 10 x 12 = 120 conexões       │
│ Limite Máximo do Banco (max_connections) = 200         │
│ Margem de Segurança = 40% reservado para background    │
└────────────────────────────────────────────────────────┘
```

- **IOPS Estimado:** 3.500 IOPS em pico de escrita (escrita contígua append-only de ledger entries).
- **Crescimento de Storage:** ~12 GB / mês para 10 milhões de transações.

---

## 4. Projeção FinOps (Estimativa de Custo Mensal Cloud)

| Componente | Especificação | Custo Mensal Estimado (USD) |
| :--- | :--- | :--- |
| **Compute (Containers Fargate / Cloud Run)** | 2 a 10 containers auto-scaled | ~$68.00 |
| **Banco de Dados Gerenciado (PostgreSQL Aurora)** | db.t4g.medium (2 vCPU, 4GB RAM, 100GB SSD) | ~$85.00 |
| **Cache & Distributed Lock (Redis ElastiCache)** | cache.t4g.micro (0.5GB RAM) | ~$14.00 |
| **Tráfego de Rede (Egress / Webhooks)** | ~500 GB transferência mensal | ~$35.00 |
| **Total Estimado de Infraestrutura:** | - | **~$202.00 / mês** |

---

## 5. Gargalos Identificados & Estratégias de Mitigação

1. **Gargalo #1: Lock Concorrente em Conta do Mesmo Merchant:**
   - Se um merchant receber 500 pagamentos simultâneos no mesmo segundo, o lock pessimista na linha da conta pode enfileirar transações.
   - *Mitigação:* As entradas no ledger são inseridas de forma contígua em append-only; a atualização da coluna `current_balance_in_cents` utiliza incremento atômico (`current_balance_in_cents = current_balance_in_cents + :val`), eliminando o lock exclusivo de leitura.
2. **Gargalo #2: Webhook Timeouts de Merchants Lentos:**
   - Merchants com servidores instáveis podem prender conexões de saída.
   - *Mitigação:* O Webhook Dispatcher é assíncrono com timeout estrito de 3s por tentativa e fila de retentativa desacoplada do fluxo crítico de pagamento.
