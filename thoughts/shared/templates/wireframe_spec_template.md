# 📐 Screen Wireframe & UI Component Specification

**Screen / View Name:** [e.g., OrdersListView / OrderDetailsView]  
**Linear Task:** [ENG-XX: Title]  
**Designer:** [Product Designer Agent]  
**Date:** [YYYY-MM-DD]  
**Target Viewports:** Mobile (375px), Tablet (768px), Desktop (1280px+)  

---

## 🖼️ 1. Layout Structural Blueprint

### Desktop Layout (1280px+):
```text
+-----------------------------------------------------------------------------------+
|  [Logo] HumanLayer App        [Global Search: Cmd+K]       [Bell (3)]  [User Avatar] |
+------------------+----------------------------------------------------------------+
|  Navigation      |  Page Header: Ordens de Serviço             [+ Nova Ordem (CTA)]|
|  - Dashboard     |  Filtros: [Status v] [Prioridade v] [Data v]   [Limpar Filtros] |
|  - Ordens (●)    +----------------------------------------------------------------+
|  - Clientes      |  [ ] ID   Cliente      Status      Técnico      Valor    Ações |
|  - Técnicos      |  [ ] #101 Acme Corp    [EM AND]    Carlos M.    R$ 450   [...] |
|  - Relatórios    |  [ ] #102 Stark Ind    [ABERTA]    Mariana S.   R$ 1200  [...] |
|                  |  [ ] #103 Wayne Ent    [CONCLU]    Carlos M.    R$ 890   [...] |
|  Settings        +----------------------------------------------------------------+
|  Collapse [<<]   |  Mostrando 1-10 de 42 ordens              [<]  [1] [2] [3]  [>]|
+------------------+----------------------------------------------------------------+
```

### Mobile Layout (375px):
```text
+-----------------------------------+
| [=] HumanLayer           [User v] |
+-----------------------------------+
| Ordens de Serviço                 |
| [Search OS...                   ] |
| [Filter: Todas (v)]  [+ Nova OS]  |
+-----------------------------------+
| +-------------------------------+ |
| | #101 - Acme Corp     [EM AND] | |
| | Técnico: Carlos M.            | |
| | Valor: R$ 450,00     [Ver >]  | |
| +-------------------------------+ |
| +-------------------------------+ |
| | #102 - Stark Ind     [ABERTA] | |
| | Técnico: Mariana S.           | |
| | Valor: R$ 1.200,00   [Ver >]  | |
| +-------------------------------+ |
|                                   |
| [ Sticky Footer: + Nova Ordem ]   |
+-----------------------------------+
```

---

## 🎛️ 2. Comprehensive UI State Matrix

### 2.1 Default / Active State
- Tabela paginada (desktop) ou lista de cards (mobile).
- Status badges com cores semânticas (`bg-emerald-500/10 text-emerald-400` para Concluída, `bg-amber-500/10 text-amber-400` para Em Andamento).

### 2.2 Loading / Skeleton State
- Exibir 5 linhas de Skeleton pulsantes (`animate-pulse bg-slate-800 rounded`) mantendo a largura e altura exatas dos dados.
- Sem layout shift (CLS = 0).

### 2.3 Empty State (Zero Data)
- **Ilustração / Ícone:** `FileQuestion` centralizado com opacidade reduzida (`text-slate-500`).
- **Título:** "Nenhuma ordem de serviço encontrada".
- **Descrição:** "Não há registros com os filtros atuais ou nenhuma ordem foi criada ainda."
- **Call-to-Action:** Botão primário destacado `[+ Criar Primeira Ordem de Serviço]`.

### 2.4 Error State (API Failure / Network Offline)
- **Banner / Card de Erro:** Fundo vermelho sutil (`bg-rose-500/10 border border-rose-500/20`).
- **Mensagem:** "Não foi possível carregar as ordens de serviço. Verifique sua conexão."
- **Ação de Recuperação:** Botão secundário destacado `[Tentar Novamente]`.

---

## 🎨 3. Tailwind CSS & Component Token Mapping

| Elemento | Classes Utilitárias Recomendadas | Token Semântico |
| :--- | :--- | :--- |
| **Container Card** | `bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm` | `bg-surface`, `border-subtle` |
| **Título da Página**| `text-xl font-semibold text-slate-100 tracking-tight` | `text-primary`, `fontSize.xl` |
| **Botão Primário** | `bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500` | `brand.primary`, `borderRadius.md` |
| **Input de Busca** | `bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 px-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none` | `bg-subtle`, `text-secondary` |

---

## ✨ 4. Micro-Interactions & Transitions
- **Hover Rows:** Transição suave de fundo em tabelas (`transition-colors duration-150 hover:bg-slate-800/50`).
- **Modal Opening:** Fade-in com sutil escala (`transition-all duration-200 ease-out opacity-0 scale-95 -> opacity-100 scale-100`).
- **Badge Transitions:** Transição de cor instantânea sem salto de layout na mudança de status.
