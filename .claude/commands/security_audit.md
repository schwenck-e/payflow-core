# Qualificação & Segurança: Auditoria de Segurança de Aplicação (/security_audit)

Este comando aciona o **`qa_engineer` (AppSec)** para realizar uma varredura rigorosa de segurança estática (SAST) e auditoria de vulnerabilidades de terceiros na base de código contra o **OWASP Top 10**.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/security_audit
```
*(ou focando em uma área crítica: `/security_audit "src/auth"` ou `/security_audit --strict`)*

---

## 🔍 O que o AppSec Engineer Audita Automaticamente

Ao ser acionado, o agente examina a base de código em 5 frentes críticas de segurança:

### 1. Varredura contra o OWASP Top 10
- **A01: Broken Access Control:** Verifica se rotas privadas validam roles/permissões e se IDs em parâmetros de rota possuem checagem de propriedade (*Insecure Direct Object Reference - IDOR*).
- **A02: Cryptographic Failures:** Procura segredos ou tokens hardcoded no código, chaves privadas e senhas sem hash seguro.
- **A03: Injection:** Audita todas as interações com o banco de dados procurando queries concatenadas, eval() ou `$queryRawUnsafe`.
- **A04: Insecure Design:** Verifica se há rate limiters em endpoints de login/pagamento e proteção contra submissões simultâneas (idempotência).
- **A05: Security Misconfiguration:** Checa configuração de CORS, headers HTTP (Helmet/HSTS) e tratamento de erros (sem expor stack traces sensíveis em produção).

### 2. Análise de Composição de Software (SCA)
- Executa varredura de dependências vulneráveis (`bun audit` / `npm audit` / `cargo audit`).
- Identifica CVEs conhecidas nas bibliotecas utilizadas no projeto.

### 3. Sanitização e Validação de Entrada
- Garante que todo payload vindo do cliente é rigorosamente tipado e validado via schemas (Zod, Joi, class-validator) antes de atingir as camadas internas de domínio.

---

## 📄 Emissão do Relatório Oficial

O agente gera o relatório estruturado no chat e o salva em:
📁 `thoughts/shared/qa/YYYY-MM-DD-security-audit.md` (baseado no template `security_audit_template.md`).

O relatório classifica cada apontamento como:
- 🔴 **CRÍTICO:** Bloqueia imediatamente o merge do Pull Request.
- 🟡 **ALTO / MÉDIO:** Débito de segurança a ser mitigado antes da release.
- 🟢 **CONFORME:** Padrões seguros validados com sucesso.
