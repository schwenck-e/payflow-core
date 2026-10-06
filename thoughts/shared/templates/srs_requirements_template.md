# 📋 Especificação de Requisitos de Software (SRS / ERS)
### *Padrão ISO/IEC/IEEE 29148 & BABOK*

**Projeto:** [Nome do Projeto]  
**Referência do TAP:** [thoughts/shared/governance/YYYY-MM-DD-project-charter.md]  
**Analista de Sistemas / Requisitos:** [Nome / Systems Analyst Agent]  
**Data:** [YYYY-MM-DD]  
**Versão:** 1.0.0  
**Status:** [Em Análise / Homologado / Em Desenvolvimento]  

---

## 📖 1. Visão Geral & Glossário de Domínio

### 1.1 Propósito do Documento
Este documento especifica formalmente todos os requisitos funcionais, não-funcionais e regras de negócio que governam a construção do sistema. Ele atua como o **contrato inegociável** para o Product Manager fatiar o backlog, os Engenheiros codificarem e o QA Engineer certificar a conformidade.

### 1.2 Glossário de Termos do Domínio (Ubiquitous Language)
| Termo | Definição no Contexto do Negócio |
| :--- | :--- |
| **Ordem de Serviço (OS)** | Instrumento formal que registra uma solicitação de manutenção, peça ou serviço técnico. |
| **Técnico de Campo** | Profissional credenciado encarregado de executar o serviço nas dependências do cliente. |
| **Laudo Técnico** | Parecer conclusivo preenchido pelo técnico descrevendo o defeito encontrado e a solução aplicada. |
| **Inadimplência** | Condição em que o cliente possui débitos vencidos há mais de 30 dias. |

---

## ⚙️ 2. Requisitos Funcionais (RF)

| ID | Nome do Requisito | Descrição Comportamental | Entradas | Processamento | Saídas | Prioridade (MoSCoW) |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **RF-001** | Autenticação & Sessão | Permitir que usuários autentiquem-se via e-mail e senha com JWT. | E-mail, Senha | Valida hash bcrypt, emite JWT (expira em 8h) e refresh token. | Token JWT, Cookie de sessão, Perfil | **MUST** |
| **RF-002** | Cadastro de Clientes | Permitir criação, edição, busca e inativação de clientes com validação de documento. | Nome, CPF/CNPJ, E-mail, Telefone, Endereço | Valida unicidade de documento e integridade dos campos. | Cliente persistido no banco com ID único | **MUST** |
| **RF-003** | Abertura de Ordem de Serviço | Permitir que atendentes abram uma nova OS vinculada a um cliente com prioridade e descrição. | ClienteID, Descrição, Prioridade (`BAIXA`, `MEDIA`, `ALTA`, `URGENTE`) | Valida regra de inadimplência (RN-02), gera número sequencial e define status inicial `ABERTA`. | OS criada com número sequencial e data | **MUST** |
| **RF-004** | Atribuição de Técnico | Permitir alocar um técnico credenciado para uma OS existente. | OrdemID, TecnicoID | Valida disponibilidade do técnico e transiciona status para `EM_ANDAMENTO`. | OS atualizada com técnico vinculado | **MUST** |
| **RF-005** | Apontamento de Itens e Peças | Permitir registrar peças utilizadas e horas trabalhadas na OS. | OrdemID, ItemID, Quantidade, ValorUnitario | Valida estoque disponível e calcula subtotal automaticamente. | Linha de item gravada e total da OS recalculado | **SHOULD** |
| **RF-006** | Conclusão da OS com Laudo | Permitir que o técnico finalize o atendimento registrando o laudo e assinatura do cliente. | OrdemID, LaudoTexto, AssinaturaBase64, Fotos | Valida preenchimento mínimo (RN-01) e transiciona status para `CONCLUIDA`. | OS encerrada com comprovante gerado | **MUST** |
| **RF-007** | Cancelamento de OS | Permitir cancelar ordens abertas respeitando regras de faturamento. | OrdemID, MotivoCancelamento | Valida se status permite cancelamento conforme RN-03. | OS transicionada para `CANCELADA` | **COULD** |

---

## 🛡️ 3. Requisitos Não-Funcionais (RNF)

| ID | Categoria | Declaração do Requisito | Métrica Mensurável / Alvo |
| :--- | :--- | :--- | :--- |
| **RNF-001** | **Performance** | O tempo de resposta para operações de leitura e listagem de ordens deve ser sub-segundo. | $\le 150\text{ms}$ (p95) sob carga nominal de 250 req/s. |
| **RNF-002** | **Disponibilidade** | O sistema deve operar continuamente com alta confiabilidade operacional. | SLA $\ge 99.9\%$ de uptime mensal (máximo 43.8 min de downtime). |
| **RNF-003** | **Segurança** | As senhas devem ser armazenadas com algoritmos de derivação de chave fortes e comunicação cifrada. | Hash bcrypt com cost factor 12. Comunicação 100% via HTTPS/TLS 1.3. |
| **RNF-004** | **Escalabilidade** | A arquitetura deve suportar crescimento de volume de ordens sem degradação linear. | Suportar até 100.000 ordens/ano com particionamento de índices de busca. |
| **RNF-005** | **Acessibilidade** | A interface visual deve ser acessível e de fácil leitura em dispositivos móveis sob sol intenso. | Conformidade com **WCAG 2.1 AAA** (contraste $\ge 4.5:1$ e touch target $\ge 44\text{px}$). |
| **RNF-006** | **Privacidade / LGPD**| O sistema deve anonimizar dados pessoais de clientes em logs de telemetria e auditoria. | Zero PII (CPF, senhas, cartões) em logs estruturados JSON. |

---

## ⚖️ 4. Catálogo de Regras de Negócio (RN)

As regras de negócio são **invariantes de domínio puras**, independentes de banco de dados ou tecnologia de frontend:

- **`RN-001 (Pré-requisito de Conclusão):`** Uma Ordem de Serviço só pode ser marcada como `CONCLUIDA` se possuir pelo menos um Técnico atribuído, um Laudo Técnico com no mínimo 20 caracteres e o aceite/assinatura digital do cliente registrado.
- **`RN-002 (Inadimplência de Cliente):`** Clientes com status financeiro `INADIMPLENTE` não podem ter ordens abertas com prioridade `URGENTE` sem autorização expressa de um usuário com perfil `GERENTE`.
- **`RN-003 (Política de Cancelamento):`** Uma OS só pode ser cancelada se o seu status for `ABERTA` ou `EM_ANDAMENTO`. Se houver itens de peças já faturados, o estorno de estoque deve ser executado atomicamente na mesma transação.
- **`RN-004 (Numeração Sequencial Única):`** Todo número de OS é imutável, único e gerado de forma contígua no formato `OS-YYYY-NNNNNN`.
- **`RN-005 (Trava de Edição Pós-Conclusão):`** Ordens com status `CONCLUIDA` ou `CANCELADA` tornam-se somente-leitura (*immutable*). Nenhuma alteração cadastral ou financeira pode ser aplicada retroativamente.

---

## 📊 5. Critérios de Homologação da Especificação
- [ ] Todos os Requisitos Funcionais possuem priorização MoSCoW acordada.
- [ ] Todos os Requisitos Não-Funcionais possuem métricas objetivamente mensuráveis.
- [ ] Todas as Regras de Negócio possuem testes unitários previstos.
- [ ] Aprovado formalmente pelo Systems Analyst e validado com o Product Manager.
