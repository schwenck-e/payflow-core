# Concepção de Produto & UX/UI: Padronização do Design System (/design_system)

Este comando aciona o **`product_designer`** para estruturar ou auditar os tokens de design (cores, tipografia, espaçamentos, elevação e acessibilidade WCAG AAA) da aplicação, exportando para `thoughts/shared/design/tokens.json` e configurando `tailwind.config.js`.

---

## 🧭 Como Usar

No chat do CodeLayer WUI ou terminal:
```text
/design_system
```
*(ou especificando identidade: `/design_system "Tema Dark Moderno com paleta Slate e Indigo, foco em alta densidade de dados"`)*

---

## 🔍 O que o Product Designer Executa Autonomamente

Ao ser acionado, o agente:
1. **Analisa o Frontend Existente e as Diretrizes Visuais:**
   - Inspeciona componentes React, folhas de estilo CSS e configurações do Tailwind.
   - Avalia a coerência da paleta de cores e o uso de classes arbitrárias.
2. **Gera os Tokens Canônicos de Design:**
   - Baseado no template `thoughts/shared/templates/design_system_template.json`.
   - Define escala de cores: Brand, Neutrals, Feedback Semântico (Sucesso, Atenção, Erro, Info).
   - Define escala tipográfica, escala de espaçamentos (grid de 8px), raios de curvatura e elevações/sombras.
3. **Validação Rigorosa de Acessibilidade (WCAG 2.1 AAA):**
   - Testa a relação de contraste entre cores de primeiro plano (textos/ícones) e fundos.
   - Enforça contraste mínimo de 4.5:1 para texto normal e 3:1 para componentes visuais.
4. **Sincronização com o Código do Projeto:**
   - Atualiza ou gera `tailwind.config.js` estendendo o tema com os tokens padronizados.
   - Salva a especificação oficial em `thoughts/shared/design/tokens.json`.
   - Gera um guia de uso de componentes em `thoughts/shared/design/design-system-guide.md`.
