# Arquitetura Sistêmica: Auditoria de Conformidade e Prevenção de Drift (/verify_architecture)

Este comando audita a base de código do projeto contra os modelos arquiteturais (**C4 Model**), decisões registradas (**ADRs**) e contratos de API/dados (**OpenAPI, AsyncAPI, Prisma**) salvos em `thoughts/shared/`.

O objetivo é garantir **tolerância zero para degradação arquitetural invisível (Architectural Drift)** antes do merge de grandes releases ou durante revisões de PRs.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/verify_architecture
```
*(ou focando em um módulo específico: `/verify_architecture "src/modules/orders"`)*

---

## 🔍 Protocolo de Execução Autônoma

Ao ser invocado, o agente assume a persona do **System Architect** e executa os seguintes passos:

### 1. Leitura e Indexação dos Artefatos de Arquitetura
1. Localiza a especificação arquitetural mais recente em `thoughts/shared/architecture/*c4*.md` (ou `.dsl`).
2. Lê todas as ADRs ativas em `thoughts/shared/architecture/adr/*.md` (focando nas com status `Accepted`).
3. Lê os contratos de dados e APIs em `thoughts/shared/contracts/` ou schemas principais (`schema.prisma`, `openapi.yaml`, etc.).

### 2. Inspeção Estática do Código-Fonte (AST & Dependency Graph)
O agente investiga o código-fonte procurando anomalias em 4 dimensões críticas:

#### A. Fronteiras de Domínio e Bounded Contexts (DDD)
- Verifica se módulos isolados estão importando diretamente models internos ou repositórios privados de outros domínios sem passar por interfaces públicas ou Domain Services.
- Checa acoplamento cíclico entre diretórios de negócio.

#### B. Conformidade com as ADRs Vigentes
- Compara o código contra as decisões registradas:
  - *Exemplo:* Se uma ADR definiu **"Autenticação JWT Stateless com RBAC"**, o agente verifica se não há sessions guardadas em memória ou cookies acoplados indevidamente.
  - *Exemplo:* Se uma ADR definiu **"Persistência via Prisma ORM"**, alerta caso encontre queries SQL cruas (`raw query`) não autorizadas.

#### C. Derivação de Contratos (Contract Drift)
- Confere se as rotas registradas nos controllers coincidem com as especificações OpenAPI.
- Valida se os campos retornados pelos DTOs e entidades respeitam os enums e tipos físicos dos contratos de dados.

#### D. Requisitos Não-Funcionais (NFRs) e Resiliência
- **Idempotência:** Valida se rotas de mutação financeira ou de estoque possuem controle de concorrência ou deduplicação.
- **Transações Atômicas:** Confere se operações que alteram pai e filhos (ex: Ordem e Itens) estão envolvidas em transações (`$transaction`).
- **Validação de Entrada:** Garante que todo payload externo é validado antes da camada de serviço (ex: schemas Zod).

---

### 3. Emissão do Relatório de Conformidade Arquitetural

O agente gera o relatório estruturado no chat e o salva em:
📁 `thoughts/shared/architecture/audits/YYYY-MM-DD-architecture-audit.md`

#### Formato do Relatório:

```markdown
# 🏛️ Relatório de Auditoria Arquitetural (Architecture Conformance Report)
- **Data:** YYYY-MM-DD
- **Score de Saúde Arquitetural:** 94/100 (Aprovado com Ressalvas)
- **Status Geral:** [APROVADO | ALERTA | REPROVADO]

## 1. Sumário Executivo
Breve diagnóstico sobre a maturidade estrutural e alinhamento do código com a visão do C4 Model.

## 2. Violações Detectadas por Severidade

### 🔴 CRÍTICO (Bloqueia Merge / Quebra de Contrato)
- **Item:** [Descrição da violação de fronteira ou ADR]
  - **Arquivo:** `src/modules/...`
  - **Contrato Violado:** ADR-002 / C4 Component Model
  - **Impacto:** Acoplamento direto entre domínio de Vendas e Estoque.
  - **Remediação Recomendada:** Utilizar Domain Service ou emitir evento Outbox.

### 🟡 ALERTA (Débito Técnico Estrutural)
- **Item:** Falta de transação atômica em mutação de múltiplos registros.

### 🟢 CONFORME (Boas Práticas Validadas)
- [x] Bounded Context de Autenticação 100% isolado com RBAC.
- [x] Schemas Zod cobrindo 100% dos controllers.
- [x] Sem queries cruas detectadas.

## 3. Plano de Ação Imediato
Passos claros e pontuais para sanar os apontamentos críticos.
```
