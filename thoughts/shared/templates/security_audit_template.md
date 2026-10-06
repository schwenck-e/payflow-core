# 🛡️ Relatório de Auditoria de Segurança de Aplicação (AppSec & SAST)

- **Projeto / Repositório:** `<PROJECT_NAME>`
- **Data da Auditoria:** `YYYY-MM-DD`
- **Auditor Responsável:** `qa_engineer` (AppSec)
- **Status da Liberação:** `[APROVADO | BLOQUEADO | APROVADO COM RESSALVAS]`
- **Vulnerabilidades Críticas:** `<0>` | **Altas:** `<0>` | **Médias:** `<0>` | **Baixas:** `<0>`

---

## 1. Sumário Executivo de Segurança

Diagnóstico conciso sobre a postura de segurança da base de código, gestão de segredos e conformidade com os padrões de desenvolvimento seguro da indústria.

---

## 2. Checklist de Conformidade OWASP Top 10

| Item OWASP | Status | Observações / Evidências no Código |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | `[CONFORME / NÃO CONFORME]` | Rotas protegidas por middleware de autenticação e validação de roles RBAC. |
| **A02: Cryptographic Failures** | `[CONFORME / NÃO CONFORME]` | Senhas hasheadas com Argon2id/Bcrypt; chaves JWT com tamanho adequado; sem segredos hardcoded. |
| **A03: Injection** | `[CONFORME / NÃO CONFORME]` | Queries parametrizadas via ORM tipado (Prisma/Gorm); zero ocorrências de `$queryRawUnsafe` ou concatenação de SQL. |
| **A04: Insecure Design** | `[CONFORME / NÃO CONFORME]` | Rate limiting ativo em endpoints sensíveis (login/checkout); idempotência em mutações financeiras. |
| **A05: Security Misconfiguration** | `[CONFORME / NÃO CONFORME]` | Headers de segurança ativos (Helmet, CORS restrito sem wildcard `*` em produção). |
| **A06: Vulnerable Components** | `[CONFORME / NÃO CONFORME]` | Dependências auditadas via `bun audit` / `npm audit` com zero CVEs críticas conhecidas. |
| **A07: Identification & Auth Failures** | `[CONFORME / NÃO CONFORME]` | Expiração de token JWT adequada (15m a 1h); proteção contra brute force. |
| **A08: Software & Data Integrity** | `[CONFORME / NÃO CONFORME]` | Validação estrita de schemas de entrada (Zod) antes do processamento nos controllers. |
| **A09: Security Logging & Monitoring** | `[CONFORME / NÃO CONFORME]` | Logs estruturados sem vazamento de dados sensíveis (PII / senhas / tokens). |
| **A10: Server-Side Request Forgery** | `[CONFORME / NÃO CONFORME]` | Requisições HTTP externas restritas a URLs permitidas (whitelist). |

---

## 3. Matriz de Vulnerabilidades Encontradas

### 🔴 CRÍTICA: `<Título da Vulnerabilidade>`
- **Arquivo / Linha:** `src/...`
- **Classificação:** CWE-XXX / OWASP A0X
- **Vetor de Ataque:** Explicação de como um atacante poderia explorar a vulnerabilidade.
- **Evidência:** Trecho de código vulnerável.
- **Ação de Remediação:** Código corrigido ou ajuste de configuração necessário.

---

## 4. Auditoria de Dependências de Terceiros (SCA / CVEs)

- **Comando Executado:** `bun audit` (ou `npm audit`)
- **Total de Pacientes Escaneados:** `<N pacotes>`
- **Resultado:** Zero vulnerabilidades críticas identificadas.

---

## 5. Parecer Final e Recomendações

Recomendação expressa do AppSec Engineer autorizando ou bloqueando a promoção do código para o ambiente de produção.
