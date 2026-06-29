import { ObjectId } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import type { BuyerInfo, Purchase } from "@/data/types";

type GiftDoc = {
  _id: ObjectId;
  name: string;
  price: number;
  singlePurchase?: boolean;
  status?: "available" | "reserved" | "purchased" | "claimed";
  purchases?: Purchase[];
};

type PendingDoc = {
  _id: ObjectId;
  giftId: string;
  buyerInfo: BuyerInfo;
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
};

export interface PendingPaymentRow {
  _id: string;
  giftId: string;
  giftName: string;
  giftPrice: number;
  buyerInfo: BuyerInfo;
  amount: number;
  createdAt: string;
}

export async function createPendingPayment({
  giftId,
  buyerInfo,
  amount,
}: {
  giftId: string;
  buyerInfo: BuyerInfo;
  amount: number;
}): Promise<string> {
  const client = await getMongoClient();
  const result = await client
    .db("carol-joao")
    .collection<Omit<PendingDoc, "_id">>("pending_payments")
    .insertOne({
      giftId,
      buyerInfo,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  return result.insertedId.toString();
}

export async function listPendingPayments(): Promise<PendingPaymentRow[]> {
  const client = await getMongoClient();
  const db = client.db("carol-joao");
  const rows = await db
    .collection<PendingDoc>("pending_payments")
    .find({ status: "pending" })
    .sort({ createdAt: -1 })
    .toArray();

  if (rows.length === 0) return [];

  const giftIds = rows
    .map((r) => {
      try {
        return new ObjectId(r.giftId);
      } catch {
        return null;
      }
    })
    .filter((x): x is ObjectId => x !== null);

  const gifts = await db
    .collection<GiftDoc>("gifts")
    .find({ _id: { $in: giftIds } })
    .project<{ _id: ObjectId; name: string; price: number }>({
      name: 1,
      price: 1,
    })
    .toArray();

  const giftById = new Map(gifts.map((g) => [g._id.toString(), g]));

  return rows.map((r) => {
    const gift = giftById.get(r.giftId);
    return {
      _id: r._id.toString(),
      giftId: r.giftId,
      giftName: gift?.name ?? "(presente removido)",
      giftPrice: gift?.price ?? 0,
      buyerInfo: r.buyerInfo,
      amount: r.amount,
      createdAt: r.createdAt,
    };
  });
}

export async function confirmPendingPayment(pendingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  let pendingObjectId: ObjectId;
  try {
    pendingObjectId = new ObjectId(pendingId);
  } catch {
    return { success: false, error: "Pagamento pendente inválido." };
  }

  const client = await getMongoClient();
  const db = client.db("carol-joao");
  const pendingCol = db.collection<PendingDoc>("pending_payments");
  const giftsCol = db.collection<GiftDoc>("gifts");

  const pending = await pendingCol.findOne({
    _id: pendingObjectId,
    status: "pending",
  });
  if (!pending) {
    return { success: false, error: "Pagamento pendente não encontrado." };
  }

  let giftObjectId: ObjectId;
  try {
    giftObjectId = new ObjectId(pending.giftId);
  } catch {
    return { success: false, error: "Presente inválido." };
  }

  const gift = await giftsCol.findOne({ _id: giftObjectId });
  if (!gift) {
    return { success: false, error: "Presente não encontrado." };
  }

  const now = new Date().toISOString();

  if (gift.singlePurchase === true) {
    await giftsCol.findOneAndUpdate(
      { _id: giftObjectId, status: { $ne: "purchased" } },
      {
        $set: {
          status: "purchased",
          paymentId: null,
          updatedAt: now,
        },
      },
    );
  } else {
    const purchase: Purchase = {
      source: "mercadopago",
      buyerType: pending.buyerInfo.buyerType,
      buyerName: pending.buyerInfo.buyerName,
      buyerNames: pending.buyerInfo.buyerNames,
      paymentId: null,
      purchasedAt: now,
    };
    await giftsCol.updateOne(
      { _id: giftObjectId },
      {
        $push: { purchases: purchase },
        $set: { updatedAt: now },
      },
    );
  }

  await pendingCol.updateOne(
    { _id: pendingObjectId },
    { $set: { status: "confirmed", confirmedAt: now } },
  );

  return { success: true };
}

export async function cancelPendingPayment(pendingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  let pendingObjectId: ObjectId;
  try {
    pendingObjectId = new ObjectId(pendingId);
  } catch {
    return { success: false, error: "Pagamento pendente inválido." };
  }

  const client = await getMongoClient();
  const db = client.db("carol-joao");
  const pendingCol = db.collection<PendingDoc>("pending_payments");
  const giftsCol = db.collection<GiftDoc>("gifts");

  const pending = await pendingCol.findOne({
    _id: pendingObjectId,
    status: "pending",
  });
  if (!pending) {
    return { success: false, error: "Pagamento pendente não encontrado." };
  }

  const now = new Date().toISOString();

  try {
    const giftObjectId = new ObjectId(pending.giftId);
    const gift = await giftsCol.findOne({ _id: giftObjectId });
    if (gift?.singlePurchase === true && gift.status === "reserved") {
      await giftsCol.updateOne(
        { _id: giftObjectId },
        {
          $set: {
            status: "available",
            reservedAt: null,
            buyerType: null,
            buyerName: null,
            buyerNames: null,
            updatedAt: now,
          },
        },
      );
    }
  } catch {
    // Invalid giftId on the pending row — nothing to release.
  }

  await pendingCol.updateOne(
    { _id: pendingObjectId },
    { $set: { status: "cancelled", cancelledAt: now } },
  );

  return { success: true };
}
