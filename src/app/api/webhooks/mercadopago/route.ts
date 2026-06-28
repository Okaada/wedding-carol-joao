import { getMongoClient } from "@/lib/mongodb";
import { getPaymentClient } from "@/lib/mercadopago";
import { decodeBuyerRef } from "@/lib/external-reference";
import type { Purchase } from "@/data/types";
import { ObjectId, type Document } from "mongodb";

type GiftDoc = Document & { purchases: Purchase[] };

export async function POST(request: Request) {
  const body = await request.json();

  if (body.type !== "payment" && body.topic !== "payment") {
    return Response.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return Response.json({ received: true });
  }

  let payment;
  try {
    payment = await getPaymentClient().get({ id: paymentId });
  } catch (err) {
    console.error("Failed to fetch payment from Mercado Pago:", err);
    return Response.json({ error: "Failed to fetch payment" }, { status: 500 });
  }

  if (payment.status !== "approved") {
    return Response.json({ received: true });
  }

  const decoded = decodeBuyerRef(payment.external_reference);
  if (!decoded) {
    console.warn("Payment approved but no external_reference:", paymentId);
    return Response.json({ received: true });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(decoded.giftId);
  } catch {
    console.warn("Invalid external_reference (not ObjectId):", decoded.giftId);
    return Response.json({ received: true });
  }

  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection<GiftDoc>("gifts");

  const gift = await collection.findOne({ _id: objectId });
  if (!gift) {
    console.log("Gift not found for webhook:", decoded.giftId);
    return Response.json({ received: true });
  }

  const paymentIdStr = String(paymentId);
  const now = new Date().toISOString();

  if (gift.singlePurchase === true || !decoded.buyerInfo) {
    const result = await collection.findOneAndUpdate(
      { _id: objectId, status: { $ne: "purchased" } },
      {
        $set: {
          status: "purchased",
          paymentId: paymentIdStr,
          updatedAt: now,
        },
      },
    );

    if (!result) {
      console.log("Gift already purchased or not found:", decoded.giftId);
    }

    return Response.json({ received: true });
  }

  const purchase: Purchase = {
    source: "mercadopago",
    buyerType: decoded.buyerInfo.buyerType,
    buyerName: decoded.buyerInfo.buyerName,
    buyerNames: decoded.buyerInfo.buyerNames,
    paymentId: paymentIdStr,
    purchasedAt: now,
  };

  const result = await collection.findOneAndUpdate(
    { _id: objectId, "purchases.paymentId": { $ne: paymentIdStr } },
    {
      $push: { purchases: purchase },
      $set: { updatedAt: now },
    },
  );

  if (!result) {
    console.log("Duplicate webhook for payment, skipped:", paymentIdStr);
  }

  return Response.json({ received: true });
}
