## Context

O painel admin é construído com Next.js (App Router) e Tailwind CSS v4. O layout atual usa um sidebar fixo de 224px (`w-56`) lado a lado com o conteúdo principal via `flex`. Não há nenhum mecanismo de colapso ou overlay para telas pequenas, o que faz o sidebar ocupar metade da tela em um iPhone 16 (390px de largura) e tornar o conteúdo principal ilegível.

Toda estilização é feita com classes utilitárias Tailwind diretamente no JSX — não há CSS modules ou arquivos de estilo separados por componente.

## Goals / Non-Goals

**Goals:**
- Sidebar recolhe automaticamente em viewports `< md` (< 768px)
- Botão hambúrguer no topo abre/fecha o sidebar como overlay com backdrop
- Cabeçalhos de página e botões de ação empilham verticalmente no mobile
- Tabelas mantêm scroll horizontal acessível com `min-w-max` nas tabelas internas
- Paddings e fontes escalam corretamente entre mobile e desktop
- Login e formulários funcionam corretamente em telas pequenas

**Non-Goals:**
- Redesign visual do painel (cores, tipografia, identidade)
- Otimização para tablets (a experiência desktop já é aceitável em ≥ 768px)
- Testes automatizados de responsividade (E2E/visual regression)
- PWA ou funcionalidades offline

## Decisions

### 1. Sidebar como drawer controlado por estado React no layout pai

**Decisão:** Adicionar `useState` em `admin/layout.tsx` para controlar `sidebarOpen`. Passar o setter para o `AdminSidebar` e um botão hambúrguer no header do conteúdo principal.

**Alternativas consideradas:**
- CSS-only com `peer` do Tailwind: funciona, mas é difícil de acessibilidade e não permite fechar ao clicar no backdrop
- Componente de drawer externo (headlessui, radix): adiciona dependência desnecessária para um caso simples

**Rationale:** A solução com estado local é suficiente, sem dependências novas, e se integra naturalmente ao padrão já usado no projeto (componentes funcionais simples com hooks).

### 2. Overlay com `fixed inset-0 bg-black/40` para fechar ao clicar fora

**Decisão:** Quando o sidebar estiver aberto no mobile, renderizar um `<div>` de overlay atrás do sidebar que, ao ser clicado, fecha o sidebar.

**Rationale:** Comportamento esperado em drawers móveis; simples de implementar sem biblioteca externa.

### 3. Prefixos responsivos Tailwind (`md:`) como ponto de corte

**Decisão:** Usar `md` (768px) como breakpoint entre mobile e desktop para todo o admin.

**Rationale:** O iPhone 16 tem 390px de largura lógica — `md` garante que qualquer dispositivo abaixo de tablet seja tratado como mobile.

### 4. Tabelas com `overflow-x-auto` + `min-w-max` na `<table>`

**Decisão:** Manter o wrapper `overflow-x-auto` existente e adicionar `min-w-max` (ou `min-w-[600px]`) na `<table>` interna para forçar scroll horizontal em vez de quebrar o layout.

**Rationale:** Tabelas de dados complexas (presentes, RSVPs, usuários) não têm uma versão "card" simples; o scroll horizontal é a solução pragmática e preserva a estrutura existente.

## Risks / Trade-offs

- **Risco: Sidebar aberto por padrão no SSR pode causar flash** → Inicializar `sidebarOpen` como `false` no servidor; o estado é client-only (usar `'use client'` no layout).
- **Risco: Backdrop oculta conteúdo se sidebar abrir inesperadamente** → Sidebar começa fechado no mobile; só abre via interação do usuário.
- **Trade-off: Scroll horizontal em tabelas não é ideal no mobile** → Aceitável para uma interface administrativa interna; o custo de reescrever tabelas como cards é alto e fora do escopo.
