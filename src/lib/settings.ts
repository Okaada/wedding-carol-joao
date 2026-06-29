import { getMongoClient } from "@/lib/mongodb";

export const DEFAULT_MERCADOPAGO_PAYMENT_LINK =
  "https://link.mercadopago.com.br/presentecarolejoao";

export async function getMercadopagoPaymentLink(): Promise<string> {
  const client = await getMongoClient();
  const doc = await client
    .db("carol-joao")
    .collection("settings")
    .findOne({ key: "mercadopago_payment_link" });

  const url =
    doc && doc.value && typeof doc.value === "object"
      ? (doc.value as { url?: unknown }).url
      : undefined;

  return typeof url === "string" && url.length > 0
    ? url
    : DEFAULT_MERCADOPAGO_PAYMENT_LINK;
}
