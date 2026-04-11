## Why

O painel administrativo não é responsivo em dispositivos móveis (testado no iPhone 16), tornando-o inutilizável para gerenciar presentes, confirmações (RSVPs), usuários e configurações fora de um computador. Como os administradores podem precisar fazer ajustes rápidos de qualquer lugar, a interface precisa funcionar bem em telas pequenas.

## What Changes

- Adicionar menu hambúrguer e comportamento de gaveta (drawer) recolhível para o `AdminSidebar` em telas pequenas
- Tornar o layout principal do admin responsivo (ocultar sidebar no mobile, exibir como overlay)
- Ajustar espaçamentos e paddings para escalarem corretamente em telas pequenas
- Tornar os cabeçalhos de página responsivos (título + botão de ação empilhados no mobile)
- Melhorar a responsividade das tabelas (scroll horizontal acessível, colunas adaptáveis)
- Ajustar tamanhos de fontes e espaçamento dos cards de estatísticas para telas pequenas
- Garantir que formulários (`GiftForm`, `PixSettingsForm`, `CreateUserForm`) funcionem corretamente no mobile

## Capabilities

### New Capabilities

- `admin-mobile-layout`: Layout responsivo do painel admin com sidebar recolhível via menu hambúrguer em dispositivos móveis

### Modified Capabilities

<!-- Nenhuma spec existente precisa de alteração de requisitos — esta mudança é puramente de implementação de UI -->

## Impact

- `src/app/admin/layout.tsx` — lógica de estado para abrir/fechar sidebar no mobile
- `src/components/admin/AdminSidebar.tsx` — classes responsivas + suporte a overlay/drawer
- `src/app/admin/rsvp/page.tsx` — cabeçalho e padding responsivos
- `src/app/admin/gifts/page.tsx` — cabeçalho e padding responsivos
- `src/app/admin/gifts/new/page.tsx` — ajustes de padding
- `src/app/admin/gifts/[id]/edit/page.tsx` — ajustes de padding
- `src/app/admin/users/page.tsx` — cabeçalho e padding responsivos
- `src/app/admin/settings/page.tsx` — ajustes de padding
- `src/components/admin/GiftTable.tsx` — melhoria de scroll horizontal em tabelas
- `src/components/admin/StatsCard.tsx` — espaçamento responsivo
