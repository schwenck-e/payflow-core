# Arquitetura Sistêmica: Simulação de Carga, Dimensionamento de Capacidade & FinOps (/simulate_load)

Este comando projeta a capacidade computacional, pontos de saturação e custos em nuvem (FinOps) de um sistema ou módulo antes do deploy em produção.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/simulate_load
```
*(ou especificando cenário: `/simulate_load "10.000 usuários simultâneos com pico de 500 ordens/minuto no Fastify e SQLite/PostgreSQL"`)*

---

## 🔍 O que o System Architect Executa

Ao ser acionado, o agente:
1. **Analisa a Arquitetura Vigente:** Consulta o modelo C4 em `thoughts/shared/architecture/` e a modelagem de banco de dados (`schema.prisma`, migrations).
2. **Calcula a Demanda de Concorrência & Throughput:**
   - Estima Requisições por Segundo (RPS) em regime nominal e em pico.
   - Modela o número de conexões simultâneas necessárias no Connection Pool do banco.
3. **Mapeia Pontos de Ruptura (Bottlenecks):**
   - Identifica locks de escrita em tabelas relacionais.
   - Avalia a saturação do Event Loop e consumo de memória RAM por instância.
4. **Modela Projeção FinOps (Custo Estimado Cloud):**
   - Projeta custos mensais de Compute, Banco de Dados, Cache Redis, Egress de rede e consumo de tokens de LLM.
5. **Gera o Relatório Oficial:**
   - Salva em `thoughts/shared/architecture/simulations/YYYY-MM-DD-load-and-finops-simulation.md` (baseado no template `load_simulation_template.md`).
