# [ADR-002] Mecanismo de Idempotência Determinística Baseado em Hash SHA-256 e Cache de Resposta

- **Status:** Aprovado / Submetido ao Gate 1
- **Data:** 2026-10-06
- **Classificação:** Tipo 1 (Irreversível / One-Way Door)
- **Decisores:** System Architect, Squad Lead, Engenharia de Software
- **Componentes Afetados:** API Gateway, Middleware de Roteamento, Tabela de Idempotência

---

## 1. Contexto & Declaração do Problema
Em redes de pagamento distribuídas, falhas de timeout de rede do lado do cliente frequentemente levam a retentativas de requisições. Sem um controle determinístico de idempotência, isso acarreta cobranças duplicadas (*double-charge*), estornos desnecessários e atrito severo com pagadores finais.

---

## 2. Decisão Escolhida & Justificativa
**Decidimos implementar um Motor de Idempotência Determinística via header `Idempotency-Key` obrigatório em endpoints mutativos.**
1. O payload JSON da requisição é normalizado e tem seu hash criptográfico **SHA-256** calculado.
2. O sistema busca no banco o par `(merchant_id, idempotency_key)`.
3. Se existir e o status for `COMPLETED`:
   - Se o hash conferir: retorna imediatamente a resposta em cache com código HTTP original e header `X-Cache-Lookup: HIT`.
   - Se o hash divergir: retorna `HTTP 409 Conflict` com código `IDEMPOTENCY_PAYLOAD_MISMATCH` (RN-003).
4. Se a chave não existir:
   - Adquire lock transacional (`status: IN_PROGRESS`), processa a requisição e grava a resposta serializada (`status: COMPLETED`, `response_status_code`, `response_body`) com TTL de 24 horas.

---

## 3. Consequências & Impactos
### Positivas:
- Eliminação total de cobranças duplicadas causadas por retentativas de clientes ou proxies reversos.
- Transparência operacional com rastreabilidade clara via header `X-Cache-Lookup`.
### Riscos Mitigados:
- Concorrência de milissegundos é mitigada pelo lock pessimista/constraint única de chave no banco de dados.
