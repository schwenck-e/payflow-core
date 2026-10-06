# 🧪 Estratégia Canônica de Testes & Qualidade de Software

- **Projeto / Subsistema:** `<SERVICE_NAME>`
- **Data da Estratégia:** `YYYY-MM-DD`
- **QA & AppSec Engineer:** `qa_engineer`
- **Requisitos do Produto:** `thoughts/shared/plans/YYYY-MM-DD-prd.md`
- **Modelo Arquitetural:** `thoughts/shared/architecture/YYYY-MM-DD-c4-system-architecture.md`

---

## 1. Distribuição da Pirâmide de Testes

```
                   ▲
                  / \
                 /E2E\       10% Testes Ponta a Ponta (Playwright / Fluxos Críticos)
                /─────\
               / Integ \     20% Testes de Integração (APIs, Banco, Transações, Middleware)
              /─────────\
             /  Unitário \   70% Testes Unitários (Regras de Domínio, Invariantes, Use Cases)
            /─────────────\
```

---

## 2. Metas de Cobertura e Critérios de Aceite

| Nível de Teste | Alvo de Cobertura | Ferramentas | Foco de Validação |
| :--- | :--- | :--- | :--- |
| **Unitário** | ≥ 85% de Linhas / Branches | Vitest / Jest / Go Test | Regras puras de domínio, cálculos, invariantes e validações Zod. |
| **Integração** | 100% de Rotas / Controllers | Supertest / Vitest | Contratos de API, status HTTP, autenticação JWT, Prisma ORM e transações. |
| **E2E (Ponta a Ponta)** | 100% dos Fluxos Críticos | Playwright | Jornada do usuário na UI, preenchimento de formulários, transição de telas e feedback visual. |

---

## 3. Matriz de Cenários de Teste por Módulo

| Módulo / Domínio | Cenário Nominal (Happy Path) | Cenários de Borda (Edge Cases) | Cenários Negativos / Erro |
| :--- | :--- | :--- | :--- |
| `<Ex: Auth / JWT>` | Login com credenciais válidas e retorno de token JWT | Token expirando no milissegundo exato; Refresh token rotativo | Senha inválida (401); Usuário inativo; Payload malformado (400) |
| `<Ex: Ordens de Serviço>` | Abertura de OS com itens e cálculo de total correto | OS com 50+ itens; Preço unitário com 4 casas decimais | Tentativa de fechar OS sem técnico atribuído; Concorrência otimista (versão defasada) |
| `<Ex: Financeiro / Faturamento>` | Conversão de OS em fatura com baixa atômica | Fatura com desconto de 100%; Pagamento parcelado | Baixa duplicada (Idempotency Key repetida); Saldo negativo |

---

## 4. Gestão de Massa de Dados de Teste (Test Fixtures & Seeding)

1. **Isolamento de Estado:** Cada suíte de teste roda contra banco isolado ou executa rollback transacional após cada teste.
2. **Deterministic Factories:** Utilização de factories tipadas para gerar dados sintéticos determinísticos (sem dependência de dados voláteis de produção).
3. **Mocks de Dependências Externas:** Provedores de e-mail, gateways de pagamento e webhooks de terceiros devem ser 100% mockados em ambientes de teste automatizado.

---

## 5. Critérios de Bloqueio de Release (Quality Gate)

A Pull Request ou Release é **automaticamente reprovada** se:
- Qualquer teste unitário, de integração ou E2E falhar.
- A cobertura de código diminuir em relação à branch `main`.
- For detectada qualquer vulnerabilidade crítica ou alta no scan SAST.
- Houver testes com comportamento intermitente (*flaky tests*).
