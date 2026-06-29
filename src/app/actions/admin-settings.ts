"use server";

import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

export type SettingsResult = { success: boolean; error?: string };

const MERCADOPAGO_LINK_PREFIX = "https://link.mercadopago.com.br/";

export async function setMercadopagoPaymentLink(
  url: string,
): Promise<SettingsResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Não autorizado." };

  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith(MERCADOPAGO_LINK_PREFIX)) {
    return { success: false, error: "Informe uma URL válida." };
  }

  try {
    const client = await getMongoClient();
    await client
      .db("carol-joao")
      .collection("settings")
      .updateOne(
        { key: "mercadopago_payment_link" },
        {
          $set: {
            key: "mercadopago_payment_link",
            value: { url: trimmed, updatedAt: new Date().toISOString() },
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

    revalidatePath("/admin/settings");
    revalidatePath("/presentes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao salvar o link de pagamento." };
  }
}

export async function savePixSettings(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Não autorizado." };

  const keyType = (formData.get("keyType") as string)?.trim();
  const keyValue = (formData.get("keyValue") as string)?.trim();
  const recipientName = (formData.get("recipientName") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();

  if (!keyType || !keyValue || !recipientName || !city) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  try {
    const client = await getMongoClient();
    await client
      .db("carol-joao")
      .collection("settings")
      .updateOne(
        { key: "pix" },
        {
          $set: {
            key: "pix",
            value: { keyType, keyValue, recipientName, city },
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

    revalidatePath("/presentes");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao salvar configurações." };
  }
}
