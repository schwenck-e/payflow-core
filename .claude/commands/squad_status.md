# Orquestração da Squad: Painel de Status em Tempo Real (/squad_status)

Este comando aciona o **`squad_lead`** para compilar e exibir o status em tempo real de toda a squad autônoma: progresso nos 8 estágios, tickets no Linear, status dos testes e aprovações humanas pendentes.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/squad_status
```
*(ou informando projeto: `/squad_status "ordem-servico-app"`)*

---

## 🔍 O que o Squad Lead Exibe no Painel Executivo

Ao ser acionado, o `squad_lead`:
1. **Lê o Manifesto Ativo da Squad:**
   - Inspeciona os arquivos em `thoughts/shared/squad/` e recupera o manifesto de entrega mais recente.
2. **Sincroniza o Progresso dos Papéis:**
   - **Product Designer:** Status dos wireframes e design tokens.
   - **System Architect:** Status da modelagem C4 e auditoria de drift.
   - **Product Manager & Devs:** Status do Épico no Linear (`Ready for Dev`, `In Dev`, `Code Review`, `Done`).
   - **QA & AppSec:** Status dos testes unitários/E2E e auditoria SAST OWASP Top 10.
   - **DevOps & SRE:** Status da infraestrutura Docker, pipeline CI/CD e release.
3. **Identifica Bloqueios e Gates Pendentes:**
   - Destaca se há algum Approval Gate aguardando decisão humana no CodeLayer WUI.
   - Aponta eventuais falhas de teste ou regressões arquiteturais.
4. **Recomenda a Próxima Ação:**
   - Indica qual especialista deve ser acionado ou se a squad está pronta para o próximo estágio.
