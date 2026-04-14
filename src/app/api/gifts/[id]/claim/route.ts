import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const buyerName = (body.buyerName as string)?.trim();
  const buyerType = body.buyerType as string;
  const buyerNames = body.buyerNames as string[] | undefined;

  if (!buyerName) {
    return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  if (!["individual", "couple", "group"].includes(buyerType)) {
    return Response.json({ error: "Tipo de comprador inválido." }, { status: 400 });
  }

  if (buyerType === "couple" && (!buyerNames || buyerNames.length < 2)) {
    return Response.json(
      { error: "Informe pelo menos 2 nomes para casal." },
      { status: 400 },
    );
  }

  if (buyerType === "group" && (!buyerNames || buyerNames.length < 2)) {
    return Response.json(
      { error: "Informe pelo menos 2 nomes para grupo." },
      { status: 400 },
    );
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  const client = await getMongoClient();
  const result = await client
    .db("carol-joao")
    .collection("gifts")
    .findOneAndUpdate(
      { _id: objectId, status: "available" },
      {
        $set: {
          status: "claimed",
          buyerType,
          buyerName,
          buyerNames: buyerNames ?? [buyerName],
          claimedBy: buyerName,
          claimedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    );

  if (!result) {
    return Response.json(
      { error: "Este presente já foi reservado." },
      { status: 409 },
    );
  }

  return Response.json({ success: true });
}
