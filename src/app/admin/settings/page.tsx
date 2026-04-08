import { getMongoClient } from "@/lib/mongodb";
import PixSettingsForm from "@/components/admin/PixSettingsForm";
import type { PixSettings } from "@/data/types";

export default async function SettingsPage() {
  const client = await getMongoClient();
  const doc = await client
    .db("carol-joao")
    .collection("settings")
    .findOne({ key: "pix" });

  const pixSettings = doc?.value as PixSettings | undefined;

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Configurações
      </h1>

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
