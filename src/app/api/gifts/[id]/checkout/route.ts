import { getMongoClient } from "@/lib/mongodb";
import { getPreferenceClient } from "@/lib/mercadopago";
import { releaseExpiredReservations } from "@/lib/gifts";
import { logMpError } from "@/lib/mp-errors";
import { encodeBuyerRef, type BuyerInfo } from "@/lib/external-reference";
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (gift.singlePurchase === true) {
    const result = await collection.findOneAndUpdate(
      { _id: objectId, status: "available" },
      {
        $set: {
          status: "reserved",
          reservedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(buyerName && {
            buyerName,
            buyerType,
            buyerNames: buyerNames ?? [buyerName],
          }),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return Response.json(
        { error: "Este presente já foi reservado." },
        { status: 409 },
      );
    }

    try {
      const preference = await getPreferenceClient().create({
        body: {
          items: [
            {
              id: id,
              title: result.name as string,
              quantity: 1,
              unit_price: (result.price as number) / 100,
              currency_id: "BRL",
            },
          ],
          external_reference: id,
          ...(baseUrl
            ? {
                back_urls: {
                  success: `${baseUrl}/presentes/obrigado`,
                  failure: `${baseUrl}/presentes`,
                  pending: `${baseUrl}/presentes`,
                },
                auto_return: "approved",
              }
            : {}),
        },
      });

      return Response.json({ checkoutUrl: preference.init_point });
    } catch (err) {
      await collection.updateOne(
        { _id: objectId },
        {
          $set: {
            status: "available",
            reservedAt: null,
            updatedAt: new Date().toISOString(),
          },
        },
      );

      console.error("Mercado Pago preference error:", err);
      await logMpError(id, err instanceof Error ? err.message : String(err));
      return Response.json(
        { error: "Erro ao criar pagamento. Tente novamente." },
        { status: 500 },
      );
    }
  }

  // Multi-purchase: no reservation, encode buyer info in external_reference.
  const buyerInfo: BuyerInfo | null =
    buyerName && buyerType && ["individual", "couple", "group"].includes(buyerType)
      ? {
          buyerType: buyerType as BuyerInfo["buyerType"],
          buyerName,
          buyerNames: buyerNames ?? [buyerName],
        }
      : null;

  const externalReference = buyerInfo ? encodeBuyerRef(id, buyerInfo) : id;

  try {
    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: id,
            title: gift.name as string,
            quantity: 1,
            unit_price: (gift.price as number) / 100,
            currency_id: "BRL",
          },
        ],
        external_reference: externalReference,
        ...(baseUrl
          ? {
              back_urls: {
                success: `${baseUrl}/presentes/obrigado`,
                failure: `${baseUrl}/presentes`,
                pending: `${baseUrl}/presentes`,
              },
              auto_return: "approved",
            }
          : {}),
      },
    });

    return Response.json({ checkoutUrl: preference.init_point });
  } catch (err) {
    console.error("Mercado Pago preference error:", err);
    await logMpError(id, err instanceof Error ? err.message : String(err));
    return Response.json(
      { error: "Erro ao criar pagamento. Tente novamente." },
      { status: 500 },
    );
  }
}
