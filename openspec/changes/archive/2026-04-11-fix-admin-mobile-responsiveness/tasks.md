## 1. Layout Principal e Sidebar

- [x] 1.1 Adicionar `'use client'` e `useState(false)` em `src/app/admin/layout.tsx` para controlar `sidebarOpen`
- [x] 1.2 Adicionar botão hambúrguer (ícone ☰) no cabeçalho do conteúdo principal, visível apenas no mobile (`md:hidden`)
- [x] 1.3 Renderizar backdrop (`fixed inset-0 bg-black/40 z-20`) quando `sidebarOpen` for `true` em mobile, que ao ser clicado fecha o sidebar
- [x] 1.4 Ajustar `AdminSidebar` para aceitar props `isOpen` e `onClose`, aplicando `translate-x-0` / `-translate-x-full` para animar a entrada/saída no mobile
- [x] 1.5 No desktop (`md:`), remover o comportamento de drawer: sidebar sempre visível, sem overlay

## 2. Fechar Sidebar Após Navegação

- [x] 2.1 Nos links de navegação do `AdminSidebar`, chamar `onClose()` ao clicar, para que o sidebar feche automaticamente após navegar no mobile

## 3. Responsividade dos Cabeçalhos de Página

- [x] 3.1 Em `src/app/admin/rsvp/page.tsx`: alterar o header de `flex items-center justify-between` para `flex flex-col gap-3 md:flex-row md:items-center md:justify-between`
- [x] 3.2 Em `src/app/admin/gifts/page.tsx`: aplicar mesma correção de cabeçalho responsivo
- [x] 3.3 Em `src/app/admin/users/page.tsx`: aplicar mesma correção de cabeçalho responsivo
- [x] 3.4 Em `src/app/admin/settings/page.tsx`: verificar e ajustar cabeçalho se necessário

## 4. Padding Responsivo nas Páginas

- [x] 4.1 Alterar o padding do conteúdo principal em `layout.tsx` de `p-8` para `p-4 md:p-8`
- [x] 4.2 Verificar e ajustar padding interno em `src/app/admin/gifts/new/page.tsx`
- [x] 4.3 Verificar e ajustar padding interno em `src/app/admin/gifts/[id]/edit/page.tsx`

## 5. Tabelas com Scroll Horizontal

- [x] 5.1 Em `src/components/admin/GiftTable.tsx`: adicionar `min-w-max` (ou `min-w-[600px]`) na `<table>` interna para garantir scroll horizontal correto
- [x] 5.2 Em `src/app/admin/rsvp/page.tsx`: verificar a `<table>` de RSVPs e adicionar `min-w-max` se necessário
- [x] 5.3 Em `src/app/admin/users/page.tsx`: verificar a tabela de usuários e adicionar `min-w-max` se necessário

## 6. Verificação e Testes Manuais

- [ ] 6.1 Testar o painel admin no Chrome DevTools com viewport de iPhone 16 (390×844px): verificar sidebar, navegação, cabeçalhos e tabelas
- [ ] 6.2 Testar o fluxo completo: abrir sidebar → navegar → fechar sidebar → visualizar tabela com scroll
- [ ] 6.3 Verificar que no desktop (≥ 768px) o comportamento permanece igual ao original
