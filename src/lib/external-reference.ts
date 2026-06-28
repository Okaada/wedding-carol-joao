import type { Purchase } from "@/data/types";

export type BuyerInfo = Pick<Purchase, "buyerType" | "buyerName" | "buyerNames">;

const MAX_REF_LENGTH = 200;

function encodePayload(buyerInfo: BuyerInfo): string {
  const json = JSON.stringify(buyerInfo);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function encodeBuyerRef(giftId: string, buyerInfo: BuyerInfo): string {
  let names = [...buyerInfo.buyerNames];
  let ref = `${giftId}|${encodePayload({ ...buyerInfo, buyerNames: names })}`;
  while (ref.length > MAX_REF_LENGTH && names.length > 1) {
    names = names.slice(0, -1);
    ref = `${giftId}|${encodePayload({ ...buyerInfo, buyerNames: names })}`;
  }
  return ref;
}

export function decodeBuyerRef(
  ref: string | null | undefined,
): { giftId: string; buyerInfo: BuyerInfo | null } | null {
  if (!ref) return null;
  const sep = ref.indexOf("|");
  if (sep === -1) {
    return { giftId: ref, buyerInfo: null };
  }
  const giftId = ref.slice(0, sep);
  const payload = ref.slice(sep + 1);
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as BuyerInfo;
    if (
      parsed &&
      typeof parsed.buyerName === "string" &&
      Array.isArray(parsed.buyerNames) &&
      ["individual", "couple", "group"].includes(parsed.buyerType)
    ) {
      return { giftId, buyerInfo: parsed };
    }
    return { giftId, buyerInfo: null };
  } catch {
    return { giftId, buyerInfo: null };
  }
}
