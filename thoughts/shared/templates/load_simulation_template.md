# 📈 Simulação de Carga, Dimensionamento de Capacidade & FinOps

- **Sistema / Subsistema:** `<SERVICE_NAME>`
- **Data da Simulação:** `YYYY-MM-DD`
- **Arquiteto Responsável:** System Architect
- **Modelo Arquitetural de Referência:** `thoughts/shared/architecture/YYYY-MM-DD-c4-system-architecture.md`
- **Ambiente Alvo:** `<AWS / GCP / Bare Metal / Local>`

---

## 1. Perfil de Tráfego Estimado

| Métrica de Demanda | Cenário Nominal (Dia a Dia) | Cenário de Pico (Black Friday / Promoção) | Fator de Sobrecarga |
| :--- | :--- | :--- | :--- |
| **Usuários Ativos Simultâneos (CCU)** | `<ex: 250>` | `<ex: 2.500>` | 10x |
| **Requisições por Segundo (RPS)** | `<ex: 50 req/s>` | `<ex: 600 req/s>` | 12x |
| **Throughput de Escrita (WPS)** | `<ex: 10 tx/s>` | `<ex: 120 tx/s>` | 12x |
| **Throughput de Leitura (RPS)** | `<ex: 40 req/s>` | `<ex: 480 req/s>` | 12x |
| **Tamanho Médio do Payload (JSON)** | `<ex: 2.5 KB>` | `<ex: 2.5 KB>` | 1x |

---

## 2. Dimensionamento da Camada de Aplicação (Compute)

| Recurso | Configuração Mínima (Nominal) | Configuração Escalada (Pico) | Política de Auto-Scaling |
| :--- | :--- | :--- | :--- |
| **Instâncias / Containers** | 2 réplicas (HA Mínimo) | 8 réplicas | CPU > 70% ou RPS > 150/pod |
| **CPU por Instância** | 0.5 vCPU | 1.0 vCPU | - |
| **Memória RAM por Instância** | 512 MB | 1024 MB | Memory > 80% |
| **Concorrência por Processo** | 100 req simultâneas (Fastify Event Loop) | 250 req simultâneas | - |

---

## 3. Dimensionamento do Banco de Dados & Connection Pool

```
┌────────────────────────────────────────────────────────┐
│               CÁLCULO DO CONNECTION POOL               │
├────────────────────────────────────────────────────────┤
│ Total Pods = 8 pods                                    │
│ Pool por Pod = 10 conexões                             │
│ Conexões Ativas em Pico = 8 x 10 = 80 conexões         │
│ Limite Máximo do Banco (max_connections) = 150         │
│ Margem de Segurança = 46% reservado para background    │
└────────────────────────────────────────────────────────┘
```

- **I/O Operations (IOPS Estimado):** `<ex: 1.200 IOPS em pico de escrita>`
- **Crescimento de Armazenamento:** `<ex: ~15 GB / mês>`
- **Estratégia de Cache (Redis):** Cache-aside para leituras com TTL de 5 minutos; Redução de 75% da carga no banco relacional.

---

## 4. Projeção FinOps (Estimativa de Custo Mensal Cloud)

| Componente | Especificação | Custo Mensal Estimado (USD) |
| :--- | :--- | :--- |
| **Compute (Containers / Pods)** | 2 a 8 containers (0.5 vCPU, 512MB) | ~$35.00 |
| **Banco de Dados Gerenciado** | PostgreSQL / SQLite replicado (2 vCPU, 4GB RAM, 100GB SSD) | ~$65.00 |
| **Cache (Redis Instance)** | 1 GB RAM gerenciado | ~$15.00 |
| **Tráfego de Rede (Egress)** | ~250 GB transferência mensal | ~$22.00 |
| **LLM Tokens / AI Inference** | ~50k chamadas/mês (Gemini Flash / Claude Haiku) | ~$18.00 |
| **Total Estimado:** | - | **~$155.00 / mês** |

---

## 5. Ponto de Ruptura (Stress Point) & Gargalos Identificados

1. **Gargalo #1 (Banco de Dados):**
   - Sob saturação acima de 800 req/s, o lock de escritas simultâneas na tabela principal eleva a latência P99 de 45ms para 850ms.
   - *Mitigação:* Implementar buffer de escrita assíncrona ou particionamento de tabela.
2. **Gargalo #2 (Limite de Conexões Externas):**
   - Webhook externo possui rate limit de 60 req/minuto.
   - *Mitigação:* Fila de saída (BullMQ / RabbitMQ) com controle de vazão (Rate Limiter).
