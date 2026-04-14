import { getMongoClient } from "@/lib/mongodb";
import { getPanicModeStatus } from "@/lib/panic-mode";
import PixSettingsForm from "@/components/admin/PixSettingsForm";
import PanicModeToggle from "@/components/admin/PanicModeToggle";
import type { PixSettings } from "@/data/types";

export default async function SettingsPage() {
  const client = await getMongoClient();
  const doc = await client
    .db("carol-joao")
    .collection("settings")
    .findOne({ key: "pix" });

  const pixSettings = doc?.value as PixSettings | undefined;
  const panicStatus = await getPanicModeStatus();

  function getStatusText() {
    if (panicStatus.manualEnabled) return "Ativado manualmente";
    if (panicStatus.autoTriggered)
      return `Ativado automaticamente (${panicStatus.todayErrorCount} erros hoje)`;
    return "Desativado";
  }

  function getStatusColor() {
    if (panicStatus.active) return "text-red-600";
    return "text-green-600";
  }

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Configurações
      </h1>

      <div className="mb-8 rounded-lg border border-accent p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Modo de Emergência (PIX Fallback)
        </h2>
        <p className="mb-4 text-sm text-muted">
          Quando ativado, todos os presentes usam PIX ao invés do Mercado Pago.
          Ativa automaticamente se o Mercado Pago registrar 3+ erros no dia.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <PanicModeToggle enabled={panicStatus.manualEnabled} />
          <span className="text-sm text-foreground">
            Ativar manualmente
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-lg bg-section-alt p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Status:</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Erros do Mercado Pago hoje:</span>
            <span className={`font-medium ${panicStatus.todayErrorCount >= 3 ? "text-red-600" : "text-foreground"}`}>
              {panicStatus.todayErrorCount}
            </span>
          </div>
        </div>
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
