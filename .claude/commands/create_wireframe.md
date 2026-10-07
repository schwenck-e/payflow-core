# Concepção de Produto & UX/UI: Especificação Estrutural de Telas e Wireframe (/create_wireframe)

Este comando aciona o **`product_designer`** para desenhar a estrutura visual, fluxos de interação, hierarquia de componentes e estados completos de tela (Active, Loading Skeleton, Empty, Error) antes da criação de tarefas ou codificação de frontend.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/create_wireframe
```
*(ou especificando tela/módulo: `/create_wireframe "Dashboard de Ordens de Serviço" ou "/create_wireframe ENG-9"`)*

---

## 🔍 O que o Product Designer Executa Autonomamente

Ao ser acionado, o agente:
1. **Mapeia a Jornada e a Necessidade da Tela:**
   - Analisa o Épico/Ticket do Linear ou o brief de produto.
   - Identifica personas principais, dores e pontos de fricção.
   - Especifica a jornada e arquitetura de informação usando `thoughts/shared/templates/user_journey_template.md`.
2. **Desenha os Wireframes Estruturais (Desktop e Mobile):**
   - Baseado no template `thoughts/shared/templates/wireframe_spec_template.md`.
   - Gera o layout estrutural em diagramas limpos (ASCII e/ou Mermaid).
   - Define a hierarquia visual, alinhamentos, áreas de clique e elementos sticky.
3. **Mapeia a Matriz Completa de Estados (Zero Incertezas para Devs):**
   - **Default/Active:** Visão padrão com dados preenchidos e status badges semânticos.
   - **Loading Skeleton:** Especificação de skeletons pulsantes para manter CLS (Cumulative Layout Shift) = 0.
   - **Empty State:** Ilustração ou ícone amigável com botão primário para criar o primeiro registro.
   - **Error State:** Banner/card de falha de conexão ou API com botão para tentar novamente.
4. **Mapeia Classes Tailwind e Micro-Interações:**
   - Define classes exatas do Tailwind CSS conectadas aos tokens do projeto.
   - Especifica durações de transição, easing e feedbacks de clique/hover.
5. **Salva os Artefatos Estruturais:**
   - Salva em `thoughts/shared/design/wireframes/YYYY-MM-DD-<nome-da-tela>-wireframe.md`.
   - Vincula ao ticket correspondente no Linear (`ENG-XX`).
