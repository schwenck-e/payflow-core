# Modelagem de Sistemas: Diagramas de Classes e Máquinas de Estado (/model_domain)

Este comando aciona o **`systems_analyst`** para construir o modelo estrutural de domínio via Diagramas de Classes UML 2.5 (atributos tipados, visibilidade, métodos e multiplicidades) e os Diagramas de Máquinas de Estado (Statecharts) para governar o ciclo de vida das entidades centrais.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/model_domain
```
*(ou informando escopo: `/model_domain "Ciclo de Vida da Ordem de Serviço e Entidades de Domínio"`)*

---

## 🔍 O que o Systems Analyst Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa o SRS e as Regras de Negócio:**
   - Extrai as entidades fundamentais, agregados e *value objects*.
   - Identifica estados válidos, transições e regras de imutabilidade.
2. **Elabora o Diagrama de Classes UML em Mermaid:**
   - Define atributos tipados com visibilidade explícita (`+` public, `-` private, `#` protected).
   - Especifica métodos de negócio e contratos de assinatura.
   - Modela relacionamentos formais: Composição (`*--`), Agregação (`o--`), Herança (`<|--`) e Associações com multiplicidades exatas (`1`, `0..*`, `1..*`).
3. **Elabora o Diagrama de Máquinas de Estado (Statecharts):**
   - Mapeia estados iniciais, intermediários e terminais imutáveis.
   - Define eventos de disparo, condições de guarda (`[guard]`) e ações atômicas.
4. **Modela o Diagrama de Sequência de Sistema (SSD):**
   - Ilustra a cronologia de mensagens entre as camadas lógicas nos fluxos críticos.
5. **Gera o Artefato Canônico:**
   - Baseado no template `thoughts/shared/templates/uml_models_template.md`.
   - Salva em `thoughts/shared/analysis/domain/YYYY-MM-DD-domain-models.md`.
