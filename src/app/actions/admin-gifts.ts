"use server";

import { auth } from "@/lib/auth";
import { extractMercadoLivreImage } from "@/lib/mercadolivre";
import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Não autorizado");
}

export type GiftResult = { success: boolean; error?: string };

export async function createGift(
  _prev: GiftResult,
  formData: FormData,
): Promise<GiftResult> {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const imageUrl = (formData.get("imageUrl") as string)?.trim() ?? "";
  const priceStr = (formData.get("price") as string)?.trim();
  const externalUrl = (formData.get("externalUrl") as string)?.trim() ?? "";
  const purchaseMode = (formData.get("purchaseMode") as string) ?? "mercadopago";

  if (!name) return { success: false, error: "Nome é obrigatório." };
  if (!priceStr) return { success: false, error: "Preço é obrigatório." };

  const price = Math.round(parseFloat(priceStr.replace(",", ".")) * 100);
  if (isNaN(price) || price <= 0) {
    return { success: false, error: "Preço inválido." };
  }

  let resolvedImageUrl = imageUrl;
  if (!resolvedImageUrl && externalUrl) {
    resolvedImageUrl = (await extractMercadoLivreImage(externalUrl)) ?? "";
  }

  try {
    const client = await getMongoClient();
    const collection = client.db("carol-joao").collection("gifts");
    const count = await collection.countDocuments();

    await collection.insertOne({
      name,
      description,
      imageUrl: resolvedImageUrl,
      price,
      externalUrl,
      purchaseMode,
      status: "available",
      claimedBy: null,
      claimedAt: null,
      reservedAt: null,
      paymentId: null,
      buyerType: null,
      buyerName: null,
      buyerNames: null,
      sortOrder: count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/admin/gifts");
    revalidatePath("/presentes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao criar presente." };
  }
}

export async function updateGift(
  id: string,
  _prev: GiftResult,
  formData: FormData,
): Promise<GiftResult> {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const imageUrl = (formData.get("imageUrl") as string)?.trim() ?? "";
  const priceStr = (formData.get("price") as string)?.trim();
  const externalUrl = (formData.get("externalUrl") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) ?? "available";
  const purchaseMode = (formData.get("purchaseMode") as string) ?? "mercadopago";
  const buyerType = (formData.get("buyerType") as string) || null;
  const buyerName = (formData.get("buyerName") as string)?.trim() || null;
  const buyerNamesRaw = (formData.get("buyerNames") as string)?.trim() || null;
  const buyerNames = buyerNamesRaw
    ? buyerNamesRaw.split(",").map((n: string) => n.trim()).filter(Boolean)
    : null;

  if (!name) return { success: false, error: "Nome é obrigatório." };
  if (!priceStr) return { success: false, error: "Preço é obrigatório." };

  const price = Math.round(parseFloat(priceStr.replace(",", ".")) * 100);
  if (isNaN(price) || price <= 0) {
    return { success: false, error: "Preço inválido." };
  }

  let resolvedImageUrl = imageUrl;
  if (!resolvedImageUrl && externalUrl) {
    resolvedImageUrl = (await extractMercadoLivreImage(externalUrl)) ?? "";
  }

  try {
    const client = await getMongoClient();
    await client
      .db("carol-joao")
      .collection("gifts")
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            description,
            imageUrl: resolvedImageUrl,
            price,
            externalUrl,
            purchaseMode,
            status,
            buyerType,
            buyerName,
            buyerNames,
            // Clear reservation/claim fields when resetting to available
            ...(status === "available" && {
              reservedAt: null,
              claimedBy: null,
              claimedAt: null,
              paymentId: null,
            }),
            updatedAt: new Date().toISOString(),
          },
        },
      );

    revalidatePath("/admin/gifts");
    revalidatePath("/presentes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar presente." };
  }
}

export async function deleteGift(id: string): Promise<GiftResult> {
  await requireAuth();

  try {
    const client = await getMongoClient();
    await client
      .db("carol-joao")
      .collection("gifts")
      .deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/admin/gifts");
    revalidatePath("/presentes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao remover presente." };
  }
}
