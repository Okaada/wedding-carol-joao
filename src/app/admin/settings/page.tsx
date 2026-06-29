import { getMongoClient } from "@/lib/mongodb";
import { getMercadopagoPaymentLink } from "@/lib/settings";
import PixSettingsForm from "@/components/admin/PixSettingsForm";
import MercadopagoLinkForm from "@/components/admin/MercadopagoLinkForm";
import type { PixSettings } from "@/data/types";

export default async function SettingsPage() {
  const client = await getMongoClient();
  const doc = await client
    .db("carol-joao")
    .collection("settings")
    .findOne({ key: "pix" });

  const pixSettings = doc?.value as PixSettings | undefined;
  const mercadopagoLink = await getMercadopagoPaymentLink();

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Configurações
      </h1>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Mercado Pago
        </h2>
        <p className="mb-4 text-sm text-muted">
          Link aberto que abre o checkout do Mercado Pago. Os convidados digitam
          o valor manualmente seguindo as instruções do modal de compra.
        </p>
        <MercadopagoLinkForm defaultUrl={mercadopagoLink} />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Chave PIX
        </h2>
        <p className="mb-4 text-sm text-muted">
          Configure sua chave PIX para que os convidados possam enviar presentes
          em dinheiro.
        </p>
        <PixSettingsForm defaults={pixSettings} />
      </div>
    </div>
  );
}
