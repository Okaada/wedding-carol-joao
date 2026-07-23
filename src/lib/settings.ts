import { getMongoClient } from "@/lib/mongodb";
import type { PixSettings } from "@/data/types";

export const DEFAULT_MERCADOPAGO_PAYMENT_LINK =
  "https://link.mercadopago.com.br/presentecarolejoao";

/**
 * Where guest payments go is the highest-value tampering target in this
 * app. This and getPixSettings() are intentionally environment-only, NOT
 * settings-collection-backed — see openspec/changes/
 * 2026-07-23-payment-destination-env-config/ for the reasoning. Changing
 * either value now requires deploy-platform access, not just an admin
 * session.
 */
export function getMercadopagoPaymentLink(): string {
  const url = process.env.MERCADOPAGO_PAYMENT_LINK;
  return typeof url === "string" && url.length > 0
    ? url
    : DEFAULT_MERCADOPAGO_PAYMENT_LINK;
}

const PIX_KEY_TYPES = ["cpf", "email", "phone", "random"] as const;

/** Returns PIX settings from env vars, or null if any of the four is unset. */
export function getPixSettings(): PixSettings | null {
  const keyType = process.env.PIX_KEY_TYPE;
  const keyValue = process.env.PIX_KEY_VALUE;
  const recipientName = process.env.PIX_RECIPIENT_NAME;
  const city = process.env.PIX_CITY;

  if (!keyType || !keyValue || !recipientName || !city) return null;
  if (!(PIX_KEY_TYPES as readonly string[]).includes(keyType)) {
    console.error(
      `[settings] PIX_KEY_TYPE="${keyType}" is not one of ${PIX_KEY_TYPES.join(", ")}; treating PIX as unconfigured.`,
    );
    return null;
  }

  return {
    keyType: keyType as PixSettings["keyType"],
    keyValue,
    recipientName,
    city,
  };
}

export async function getMercadopagoCheckoutProEnabled(): Promise<boolean> {
  const client = await getMongoClient();
  const doc = await client
    .db("carol-joao")
    .collection("settings")
    .findOne({ key: "mercadopago_checkout_pro" });

  const enabled =
    doc && doc.value && typeof doc.value === "object"
      ? (doc.value as { enabled?: unknown }).enabled
      : undefined;

  return enabled === true;
}
