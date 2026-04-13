## ADDED Requirements

### Requirement: Reservar presente antes de criar preferência de pagamento
O sistema SHALL reservar o presente atomicamente (status: "reserved") antes de criar a preferência no Mercado Pago, impedindo que dois convidados paguem pelo mesmo item.

#### Scenario: Reserva bem-sucedida para presente disponível
- **WHEN** um convidado clica em "Presentear" em um presente com status "available"
- **THEN** o sistema SHALL atualizar atomicamente o status para "reserved" com um timestamp `reservedAt`
- **THEN** o sistema SHALL criar uma preferência de pagamento no Mercado Pago com o `_id` do presente como `external_reference`
- **THEN** o sistema SHALL retornar a URL de checkout do Mercado Pago

#### Scenario: Presente já reservado ou comprado
- **WHEN** um convidado tenta presentear um item que já está com status "reserved" ou "purchased"
- **THEN** o sistema SHALL retornar erro 409 com mensagem "Este presente já foi reservado."

### Requirement: Redirecionar convidado para checkout do Mercado Pago
O sistema SHALL redirecionar o convidado para a página de checkout do Mercado Pago após criar a preferência de pagamento.

#### Scenario: Redirecionamento para checkout
- **WHEN** a preferência é criada com sucesso
- **THEN** o frontend SHALL redirecionar o convidado para a `init_point` retornada pelo Mercado Pago

#### Scenario: Preferência inclui dados do presente
- **WHEN** a preferência é criada
- **THEN** ela SHALL conter o nome do presente como título do item, o preço em BRL, e quantidade 1
- **THEN** o `external_reference` SHALL ser o `_id` do presente no MongoDB

### Requirement: URLs de retorno após pagamento
O sistema SHALL configurar URLs de retorno (success, failure, pending) na preferência para redirecionar o convidado de volta ao site.

#### Scenario: Pagamento aprovado — retorno para página de sucesso
- **WHEN** o convidado completa o pagamento com sucesso no Mercado Pago
- **THEN** o Mercado Pago SHALL redirecionar para a URL de sucesso do site

#### Scenario: Pagamento falhou — retorno para página de presentes
- **WHEN** o pagamento falha ou é cancelado
- **THEN** o Mercado Pago SHALL redirecionar para a página de presentes

### Requirement: Expiração de reservas abandonadas
O sistema SHALL liberar presentes reservados há mais de 30 minutos que não tiveram pagamento confirmado.

#### Scenario: Reserva expirada é liberada ao carregar página
- **WHEN** a página de presentes é carregada e existem presentes com status "reserved" e `reservedAt` há mais de 30 minutos
- **THEN** o sistema SHALL atualizar esses presentes de volta para status "available", limpando `reservedAt`

#### Scenario: Reserva dentro do prazo permanece ativa
- **WHEN** um presente está com status "reserved" e `reservedAt` há menos de 30 minutos
- **THEN** o sistema SHALL manter o status "reserved" e o presente NÃO SHALL aparecer como disponível
