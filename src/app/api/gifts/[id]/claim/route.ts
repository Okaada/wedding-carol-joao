import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const guestName = (body.guestName as string)?.trim();

  if (!guestName) {
    return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
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
          status: "reserved",
          claimedBy: guestName,
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
