"use server";

import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

export type SettingsResult = { success: boolean; error?: string };

export async function togglePanicMode(enable: boolean): Promise<SettingsResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const client = await getMongoClient();
    await client
      .db("carol-joao")
      .collection("settings")
      .updateOne(
        { key: "panic_mode" },
        {
          $set: {
            key: "panic_mode",
            value: {
              enabled: enable,
              enabledAt: enable ? new Date().toISOString() : null,
            },
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

    revalidatePath("/admin/settings");
    revalidatePath("/presentes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao alterar modo de emergência." };
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
