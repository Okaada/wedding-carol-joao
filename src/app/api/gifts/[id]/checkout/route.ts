import { getMongoClient } from "@/lib/mongodb";
import { getPreferenceClient } from "@/lib/mercadopago";
import { releaseExpiredReservations } from "@/lib/gifts";
import { ObjectId } from "mongodb";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  // Release any expired reservations first
  await releaseExpiredReservations();

  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection("gifts");

  // Atomically reserve the gift
  const result = await collection.findOneAndUpdate(
    { _id: objectId, status: "available" },
    {
      $set: {
        status: "reserved",
        reservedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: id,
            title: result.name as string,
            quantity: 1,
            unit_price: (result.price as number) / 100, // cents to BRL
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
    // Rollback reservation on MP failure
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
    return Response.json(
      { error: "Erro ao criar pagamento. Tente novamente." },
      { status: 500 },
    );
  }
}
