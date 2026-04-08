## Context

O site de casamento de Carol & João ainda não possui nenhuma página implementada. Esta é a primeira feature a ser construída: a página do casal ("Nossa História"), que servirá como base para a identidade visual e arquitetura do restante do site. Todo o conteúdo será em português (pt-BR).

## Goals / Non-Goals

**Goals:**
- Criar uma página visualmente atraente e responsiva com a história do casal
- Estabelecer a stack e estrutura base do projeto
- Implementar componentes reutilizáveis (timeline, seções de conteúdo, galeria)
- Garantir boa performance e acessibilidade
- Suporte a imagens placeholder que serão substituídas por fotos reais

**Non-Goals:**
- Integração com MercadoPago (será tratada separadamente)
- Sistema de RSVP ou confirmação de presença
- Painel administrativo para edição do conteúdo
- Backend/API — esta página será estática

## Decisions

### Stack tecnológica
**Decisão:** Usar Next.js com TypeScript e Tailwind CSS.
**Alternativas consideradas:**
- HTML/CSS puro — mais simples, mas sem componentização e difícil de escalar para o restante do site
- React com Vite — bom, mas Next.js oferece SSG/SSR out-of-the-box, SEO otimizado e roteamento baseado em arquivos
**Justificativa:** Next.js é ideal para sites com conteúdo estático/semi-estático, oferece excelente performance com Static Site Generation, e a comunidade/ecossistema é robusta.

### Estrutura da página
**Decisão:** Página dividida em seções verticais com scroll suave: Hero (nome do casal + foto principal), Timeline (marcos do relacionamento) e Galeria de fotos.
**Justificativa:** Layout vertical com seções é o padrão para sites de casamento, funciona bem em mobile e é intuitivo para os convidados.

### Dados do casal
**Decisão:** Conteúdo hardcoded em um arquivo de dados TypeScript (`data/couple.ts`), não em banco de dados.
**Alternativas consideradas:**
- CMS headless (Contentful, Strapi) — overhead desnecessário para conteúdo que raramente muda
- Markdown files — possível, mas TypeScript oferece tipagem e validação
**Justificativa:** Simplicidade. O conteúdo será editado por desenvolvedores e não precisa de interface administrativa.

### Imagens
**Decisão:** Usar `next/image` para otimização automática de imagens. Fotos placeholder inicialmente, com estrutura pronta para substituição.
**Justificativa:** `next/image` oferece lazy loading, redimensionamento e formatos modernos (WebP/AVIF) automaticamente.

## Risks / Trade-offs

- **[Conteúdo placeholder]** O conteúdo da história será fictício inicialmente → O casal precisará fornecer textos e fotos reais antes do lançamento. A estrutura de dados facilita a substituição.
- **[Sem CMS]** Edições requerem mudança no código → Aceitável pois o conteúdo é estático e raramente muda. Se necessário no futuro, migrar para CMS é simples.
- **[Performance de imagens]** Muitas fotos de alta resolução podem impactar carregamento → Mitigado pelo uso de `next/image` com lazy loading e formatos otimizados.
