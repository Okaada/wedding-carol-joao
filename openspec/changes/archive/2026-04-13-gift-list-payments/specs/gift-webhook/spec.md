## ADDED Requirements

### Requirement: Receber notificações IPN do Mercado Pago
O sistema SHALL expor um endpoint POST para receber notificações de pagamento do Mercado Pago (IPN).

#### Scenario: Notificação de pagamento recebida
- **WHEN** o Mercado Pago envia um POST para `/api/webhooks/mercadopago` com topic "payment"
- **THEN** o sistema SHALL buscar os detalhes do pagamento na API do Mercado Pago usando o `data.id` recebido
- **THEN** o sistema SHALL retornar status 200 para confirmar o recebimento

#### Scenario: Notificação com topic diferente de payment
- **WHEN** o Mercado Pago envia uma notificação com topic diferente de "payment"
- **THEN** o sistema SHALL retornar status 200 sem processar

### Requirement: Confirmar pagamento aprovado e marcar presente como comprado
O sistema SHALL marcar o presente como "purchased" somente quando o status do pagamento no Mercado Pago for "approved".

#### Scenario: Pagamento aprovado
- **WHEN** o webhook recebe uma notificação e o pagamento consultado tem status "approved"
- **THEN** o sistema SHALL atualizar o presente (identificado pelo `external_reference`) para status "purchased"
- **THEN** o sistema SHALL registrar o `paymentId` do Mercado Pago no documento do presente

#### Scenario: Pagamento pendente ou rejeitado
- **WHEN** o pagamento consultado tem status "pending", "rejected", ou qualquer outro status diferente de "approved"
- **THEN** o sistema NÃO SHALL alterar o status do presente

#### Scenario: Presente não encontrado pelo external_reference
- **WHEN** o `external_reference` do pagamento não corresponde a nenhum presente no banco
- **THEN** o sistema SHALL logar um warning e retornar status 200 (para não causar retries)

### Requirement: Idempotência no processamento do webhook
O sistema SHALL processar cada pagamento de forma idempotente, sem efeitos colaterais em notificações duplicadas.

#### Scenario: Notificação duplicada para presente já comprado
- **WHEN** o webhook recebe uma notificação de pagamento aprovado para um presente que já está com status "purchased"
- **THEN** o sistema SHALL retornar 200 sem modificar o documento

### Requirement: Segurança do endpoint webhook
O sistema SHALL validar as notificações recebidas para garantir que são legítimas do Mercado Pago.

#### Scenario: Validação via consulta à API
- **WHEN** uma notificação é recebida
- **THEN** o sistema SHALL consultar a API do Mercado Pago com o ID do pagamento usando o access token do servidor para validar os dados, em vez de confiar no body da notificação
