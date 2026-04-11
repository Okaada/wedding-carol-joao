### Requirement: Sidebar recolhível no mobile
O sistema SHALL ocultar o sidebar automaticamente em viewports menores que 768px e exibi-lo como um drawer lateral ao ser ativado pelo usuário.

#### Scenario: Sidebar oculto ao carregar no mobile
- **WHEN** o usuário acessa qualquer página do admin em um dispositivo com viewport < 768px
- **THEN** o sidebar não deve estar visível na tela inicial

#### Scenario: Sidebar abre via botão hambúrguer
- **WHEN** o usuário toca no ícone de menu (hambúrguer) no cabeçalho do admin em mobile
- **THEN** o sidebar SHALL deslizar para dentro da tela como um drawer à esquerda

#### Scenario: Sidebar fecha ao clicar no backdrop
- **WHEN** o sidebar estiver aberto no mobile e o usuário tocar fora dele (no backdrop)
- **THEN** o sidebar SHALL fechar e o backdrop SHALL desaparecer

#### Scenario: Sidebar fecha após navegação
- **WHEN** o usuário tocar em um link de navegação dentro do sidebar aberto no mobile
- **THEN** o sidebar SHALL fechar automaticamente após a navegação

#### Scenario: Sidebar sempre visível no desktop
- **WHEN** o usuário acessa qualquer página do admin em um dispositivo com viewport ≥ 768px
- **THEN** o sidebar SHALL estar sempre visível sem necessidade de interação

### Requirement: Cabeçalhos de página responsivos
O sistema SHALL adaptar o layout dos cabeçalhos de página para empilhar título e botão de ação verticalmente em telas pequenas.

#### Scenario: Cabeçalho empilhado no mobile
- **WHEN** o usuário visualiza uma página admin em viewport < 768px
- **THEN** o título da página e o botão de ação principal SHALL estar em linhas separadas (flex-col)

#### Scenario: Cabeçalho em linha no desktop
- **WHEN** o usuário visualiza uma página admin em viewport ≥ 768px
- **THEN** o título e o botão de ação SHALL estar na mesma linha (flex-row justify-between)

### Requirement: Padding de conteúdo responsivo
O sistema SHALL usar paddings menores em mobile e maiores em desktop para aproveitar o espaço disponível.

#### Scenario: Padding reduzido no mobile
- **WHEN** o usuário visualiza qualquer página admin em viewport < 768px
- **THEN** o padding do conteúdo principal SHALL ser de 16px (p-4)

#### Scenario: Padding padrão no desktop
- **WHEN** o usuário visualiza qualquer página admin em viewport ≥ 768px
- **THEN** o padding do conteúdo principal SHALL ser de 32px (p-8)

### Requirement: Tabelas com scroll horizontal acessível
O sistema SHALL garantir que tabelas de dados no admin possam ser percorridas horizontalmente em telas pequenas sem quebrar o layout.

#### Scenario: Tabela com scroll horizontal no mobile
- **WHEN** o usuário visualiza uma tabela (presentes, RSVPs, usuários) em viewport < 768px
- **THEN** a tabela SHALL ser scrollável horizontalmente dentro de seu container
- **THEN** o layout da página exterior NÃO SHALL quebrar nem criar scroll horizontal na página inteira
