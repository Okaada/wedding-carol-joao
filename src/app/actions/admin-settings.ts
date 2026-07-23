"use server";

import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

export type SettingsResult = { success: boolean; error?: string };

// setMercadopagoPaymentLink and savePixSettings were removed: both wrote to
// where guest payments physically go, gated only by a valid admin session
// with no additional confirmation. That's the highest-value tampering
// target in this app. They're now environment-variable-only
// (MERCADOPAGO_PAYMENT_LINK, PIX_KEY_TYPE/PIX_KEY_VALUE/PIX_RECIPIENT_NAME/
// PIX_CITY — see src/lib/settings.ts) so changing them requires
// deploy-platform access, not just a stolen admin session. See
// openspec/changes/2026-07-23-payment-destination-env-config/.

export async function setMercadopagoCheckoutProEnabled(
  enabled: boolean,
): Promise<SettingsResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const client = await getMongoClient();
    await client
      .db("carol-joao")
      .collection("settings")
      .updateOne(
        { key: "mercadopago_checkout_pro" },
        {
          $set: {
            key: "mercadopago_checkout_pro",
            value: { enabled, updatedAt: new Date().toISOString() },
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

    revalidatePath("/admin/settings");
    revalidatePath("/presentes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao salvar a configuração." };
  }
}
