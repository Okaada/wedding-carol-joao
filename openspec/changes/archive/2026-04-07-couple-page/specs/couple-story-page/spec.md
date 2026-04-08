## ADDED Requirements

### Requirement: Página do casal acessível por rota dedicada
O sistema SHALL disponibilizar a página "Nossa História" em uma rota dedicada (`/nossa-historia` ou página inicial).

#### Scenario: Acesso à página do casal
- **WHEN** o usuário navegar para a rota da página do casal
- **THEN** o sistema SHALL exibir a página completa com todas as seções (hero, timeline, galeria) em português

### Requirement: Seção hero com apresentação do casal
A página SHALL exibir uma seção hero no topo contendo o nome do casal, uma foto principal e a data do casamento.

#### Scenario: Exibição da seção hero
- **WHEN** a página do casal for carregada
- **THEN** o sistema SHALL exibir o nome "Carol & João", uma foto principal do casal e a data do casamento

#### Scenario: Responsividade da seção hero
- **WHEN** a página for acessada em dispositivo móvel (viewport < 768px)
- **THEN** a seção hero SHALL adaptar o layout para exibição vertical, mantendo todos os elementos visíveis

### Requirement: Timeline do relacionamento
A página SHALL exibir uma timeline vertical com os marcos do relacionamento do casal, em ordem cronológica.

#### Scenario: Exibição da timeline completa
- **WHEN** a página for carregada
- **THEN** o sistema SHALL exibir uma timeline com pelo menos os seguintes marcos: como se conheceram, primeiro encontro, início do namoro, noivado e data do casamento

#### Scenario: Cada marco da timeline
- **WHEN** um marco da timeline for renderizado
- **THEN** ele SHALL conter uma data, um título, uma descrição e opcionalmente uma foto

#### Scenario: Timeline em dispositivo móvel
- **WHEN** a timeline for visualizada em dispositivo móvel
- **THEN** ela SHALL ser exibida em layout vertical linear (single column), mantendo legibilidade

### Requirement: Galeria de fotos do casal
A página SHALL exibir uma seção de galeria com fotos do casal.

#### Scenario: Exibição da galeria
- **WHEN** a seção de galeria for carregada
- **THEN** o sistema SHALL exibir as fotos em um grid responsivo

#### Scenario: Otimização de imagens
- **WHEN** as imagens da galeria forem carregadas
- **THEN** o sistema SHALL utilizar lazy loading e formatos otimizados para performance

### Requirement: Conteúdo em português
Todo o conteúdo visível da página SHALL estar em português brasileiro (pt-BR).

#### Scenario: Idioma do conteúdo
- **WHEN** qualquer seção da página for exibida
- **THEN** todos os textos, títulos, datas e labels SHALL estar em português brasileiro

### Requirement: Navegação para a página do casal
O site SHALL incluir um link de navegação que leva à página do casal.

#### Scenario: Link na navegação
- **WHEN** o usuário visualizar o menu de navegação do site
- **THEN** SHALL existir um link "Nossa História" que direciona para a página do casal

#### Scenario: Scroll suave entre seções
- **WHEN** o usuário clicar em um link de navegação interna da página
- **THEN** o sistema SHALL realizar scroll suave até a seção correspondente
