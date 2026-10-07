# Governança de Encerramento: Termo de Encerramento e Homologação UAT (/project_closeout)

Este comando aciona o **`systems_analyst`** para formalizar a homologação de usuário (UAT), confrontar o realizado contra o planejado no TAP, estruturar o manual de sustentação/handoff operacional e emitir o **Termo de Encerramento do Projeto (TEP)**.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/project_closeout
```
*(ou informando o projeto: `/project_closeout "ordem-servico-app"`)*

---

## 🔍 O que o Systems Analyst Executa Autonomamente

Ao ser acionado, o agente:
1. **Audita os Resultados da Homologação (UAT):**
   - Compila os cenários de teste de aceitação de negócio executados e evidências coletadas.
2. **Confronta o Planejado no TAP vs. Efetivamente Realizado:**
   - Avalia a variação de escopo (RFs/RNFs acordados vs entregues).
   - Avalia o cumprimento de metas de qualidade, testes e prazos.
   - Avalia custos reais de infraestrutura contra o orçamento planejado.
3. **Elabora o Manual de Sustentação & Handoff Operacional:**
   - Define os procedimentos de atendimento de Nível 1 (dúvidas/senhas), Nível 2 (análise de logs e webhooks) e Nível 3 (bugs de código e SRE).
   - Documenta endpoints de monitoramento (`/health/liveness`, `/health/readiness`).
4. **Compila as Lições Aprendidas (*Lessons Learned*):**
   - Registra boas práticas que devem ser repetidas e pontos de atrito a serem evitados em projetos futuros.
5. **Gera o Termo de Encerramento Oficial (TEP):**
   - Preenche o template `thoughts/shared/templates/project_closeout_template.md`.
   - Salva em `thoughts/shared/governance/YYYY-MM-DD-project-closeout.md`.
   - Prepara o terreno para o rito final de fechamento de épico no Linear (`/close_epic`).
