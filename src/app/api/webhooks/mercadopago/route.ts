import { getMongoClient } from "@/lib/mongodb";
import { getPaymentClient } from "@/lib/mercadopago";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const body = await request.json();

  // Only process payment notifications
  if (body.type !== "payment" && body.topic !== "payment") {
    return Response.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return Response.json({ received: true });
  }

  // Fetch payment details from Mercado Pago API (server-side validation)
  let payment;
  try {
    payment = await getPaymentClient().get({ id: paymentId });
  } catch (err) {
    console.error("Failed to fetch payment from Mercado Pago:", err);
    return Response.json({ error: "Failed to fetch payment" }, { status: 500 });
  }

  // Only process approved payments
  if (payment.status !== "approved") {
    return Response.json({ received: true });
  }

  const giftId = payment.external_reference;
  if (!giftId) {
    console.warn("Payment approved but no external_reference:", paymentId);
    return Response.json({ received: true });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(giftId);
  } catch {
    console.warn("Invalid external_reference (not ObjectId):", giftId);
    return Response.json({ received: true });
  }

  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection("gifts");

  // Idempotent: only update if not already purchased
  const result = await collection.findOneAndUpdate(
    { _id: objectId, status: { $ne: "purchased" } },
    {
      $set: {
        status: "purchased",
        paymentId: String(paymentId),
        updatedAt: new Date().toISOString(),
      },
    },
  );

  if (!result) {
    // Gift already purchased or not found — idempotent, no error
    console.log("Gift already purchased or not found:", giftId);
  }

  return Response.json({ received: true });
}
