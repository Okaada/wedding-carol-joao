import { generatePixQrCodeDataUrl, generatePixPayload } from "@/lib/pix";
import type { PixSettings } from "@/data/types";
import CopyPixButton from "./CopyPixButton";

export default async function PixSection({
  settings,
}: {
  settings: PixSettings;
}) {
  const qrDataUrl = await generatePixQrCodeDataUrl(settings);
  const payload = generatePixPayload(settings);

  return (
    <section className="rounded-2xl border border-accent bg-white p-8 text-center">
      <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Presente em PIX
      </h2>
      <p className="mb-6 text-sm text-muted">
        Se preferir, envie qualquer valor via PIX. Escaneie o QR Code abaixo ou
        copie a chave.
      </p>

      <div className="mx-auto mb-4 inline-block rounded-lg border border-accent p-2">
        <img src={qrDataUrl} alt="QR Code PIX" width={300} height={300} />
      </div>

      <div className="mx-auto max-w-md">
        <p className="mb-1 text-xs text-muted">Chave PIX ({settings.keyType})</p>
        <div className="flex items-center justify-center gap-2">
          <code className="rounded bg-section-alt px-3 py-2 text-sm text-foreground">
            {settings.keyValue}
          </code>
          <CopyPixButton payload={payload} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {settings.recipientName} — {settings.city}
        </p>
      </div>
    </section>
  );
}
