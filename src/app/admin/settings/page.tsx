import { getMercadopagoCheckoutProEnabled, getMercadopagoPaymentLink, getPixSettings } from "@/lib/settings";
import { isMercadopagoConfigured } from "@/lib/mercadopago";
import MercadopagoCheckoutProToggle from "@/components/admin/MercadopagoCheckoutProToggle";

const PIX_KEY_TYPE_LABELS: Record<string, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

export default async function SettingsPage() {
  const mercadopagoLink = getMercadopagoPaymentLink();
  const checkoutProEnabled = await getMercadopagoCheckoutProEnabled();
  const pixSettings = getPixSettings();

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Configurações
      </h1>

      <p className="mb-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        O link de pagamento do Mercado Pago e a chave PIX abaixo são
        configurados por variável de ambiente no servidor, não por aqui —
        para onde o dinheiro dos convidados vai é o alvo de maior risco desse
        site, então não deixamos isso editável só com uma sessão de admin.
        Para alterar, atualize as variáveis no ambiente de deploy e reinicie.
      </p>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Mercado Pago
        </h2>

        <div className="max-w-lg space-y-1 rounded-lg border border-accent bg-white p-4">
          <p className="text-sm font-medium text-foreground">
            Link de pagamento
          </p>
          <p className="break-all text-sm text-muted">{mercadopagoLink}</p>
          <p className="text-xs text-muted">
            Controlado por <code>MERCADOPAGO_PAYMENT_LINK</code> no servidor.
          </p>
        </div>

        <div className="mt-4">
          <MercadopagoCheckoutProToggle
            defaultEnabled={checkoutProEnabled}
            isConfigured={isMercadopagoConfigured()}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Chave PIX
        </h2>

        {pixSettings ? (
          <div className="max-w-lg space-y-2 rounded-lg border border-accent bg-white p-4 text-sm">
            <p>
              <span className="font-medium text-foreground">Tipo: </span>
              <span className="text-muted">
                {PIX_KEY_TYPE_LABELS[pixSettings.keyType] ?? pixSettings.keyType}
              </span>
            </p>
            <p>
              <span className="font-medium text-foreground">Chave: </span>
              <span className="break-all text-muted">{pixSettings.keyValue}</span>
            </p>
            <p>
              <span className="font-medium text-foreground">Recebedor: </span>
              <span className="text-muted">{pixSettings.recipientName}</span>
            </p>
            <p>
              <span className="font-medium text-foreground">Cidade: </span>
              <span className="text-muted">{pixSettings.city}</span>
            </p>
            <p className="text-xs text-muted">
              Controlado por <code>PIX_KEY_TYPE</code>, <code>PIX_KEY_VALUE</code>,{" "}
              <code>PIX_RECIPIENT_NAME</code> e <code>PIX_CITY</code> no servidor.
            </p>
          </div>
        ) : (
          <div className="max-w-lg rounded-lg border border-accent bg-white p-4 text-sm text-muted">
            PIX não configurado — defina <code>PIX_KEY_TYPE</code>,{" "}
            <code>PIX_KEY_VALUE</code>, <code>PIX_RECIPIENT_NAME</code> e{" "}
            <code>PIX_CITY</code> no ambiente do servidor para habilitar o QR
            code PIX na página de presentes.
          </div>
        )}
      </div>
    </div>
  );
}
