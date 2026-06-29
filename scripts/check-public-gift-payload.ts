import { toPublicGift } from "../src/data/types";
import type { Gift } from "../src/data/types";

const FORBIDDEN_KEYS = [
  "buyerName",
  "buyerNames",
  "buyerType",
  "claimedBy",
  "claimedAt",
  "purchases",
  "paymentId",
  "reservedAt",
] as const;

const fixture: Gift = {
  _id: "507f1f77bcf86cd799439011",
  name: "Liquidificador",
  description: "Para sucos do casal.",
  imageUrl: "https://example.com/img.jpg",
  price: 19900,
  externalUrl: "https://produto.example/",
  purchaseMode: "external",
  status: "claimed",
  singlePurchase: false,
  purchases: [
    {
      source: "claim",
      buyerType: "individual",
      buyerName: "Fulano da Silva",
      buyerNames: ["Fulano da Silva"],
      paymentId: null,
      purchasedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  claimedBy: "Fulano da Silva",
  claimedAt: "2026-01-01T00:00:00.000Z",
  reservedAt: null,
  paymentId: "mp-12345",
  buyerType: "individual",
  buyerName: "Fulano da Silva",
  buyerNames: ["Fulano da Silva"],
  sortOrder: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const publicView = toPublicGift(fixture);
const serialized = JSON.stringify(publicView);

const leaks = FORBIDDEN_KEYS.filter((k) => serialized.includes(`"${k}"`));
if (leaks.length > 0) {
  console.error(
    `FAIL: PublicGift payload leaks forbidden keys: ${leaks.join(", ")}`,
  );
  console.error(`payload: ${serialized}`);
  process.exit(1);
}

const PII_VALUES = ["Fulano da Silva", "mp-12345"];
const valueLeaks = PII_VALUES.filter((v) => serialized.includes(v));
if (valueLeaks.length > 0) {
  console.error(
    `FAIL: PublicGift payload leaks buyer values: ${valueLeaks.join(", ")}`,
  );
  console.error(`payload: ${serialized}`);
  process.exit(1);
}

console.log("OK: PublicGift payload contains no buyer-identifying data.");
console.log(serialized);
