import { getMongoClient } from "@/lib/mongodb";
import { releaseExpiredReservations } from "@/lib/gifts";
import { getMercadopagoPaymentLink } from "@/lib/settings";
import { createPendingPayment } from "@/lib/pending-payments";
import type { BuyerInfo } from "@/data/types";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let buyerName: string | null = null;
  let buyerType: string | null = null;
  let buyerNames: string[] | null = null;
  try {
    const body = await request.json();
    buyerName = (body.buyerName as string)?.trim() || null;
    buyerType = body.buyerType || null;
    buyerNames = body.buyerNames || null;
  } catch {
    // Body is optional for backwards compatibility
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  await releaseExpiredReservations();

  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection("gifts");

  const gift = await collection.findOne({ _id: objectId });
  if (!gift) {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  const buyerInfo: BuyerInfo | null =
    buyerName && buyerType && ["individual", "couple", "group"].includes(buyerType)
      ? {
          buyerType: buyerType as BuyerInfo["buyerType"],
          buyerName,
          buyerNames: buyerNames ?? [buyerName],
        }
      : null;

  if (gift.singlePurchase === true) {
    const reservation = await collection.findOneAndUpdate(
      { _id: objectId, status: "available" },
      {
        $set: {
          status: "reserved",
          reservedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(buyerInfo && {
            buyerName: buyerInfo.buyerName,
            buyerType: buyerInfo.buyerType,
            buyerNames: buyerInfo.buyerNames,
          }),
        },
      },
      { returnDocument: "after" },
    );

    if (!reservation) {
      return Response.json(
        { error: "Este presente já foi reservado." },
        { status: 409 },
      );
    }
  }

  const amount = (gift.price as number) / 100;

  const pendingId = await createPendingPayment({
    giftId: id,
    buyerInfo: buyerInfo ?? {
      buyerType: "individual",
      buyerName: "",
      buyerNames: [],
    },
    amount,
  });

  const paymentLinkUrl = await getMercadopagoPaymentLink();

  return Response.json({ paymentLinkUrl, amount, pendingId });
}
