import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Purchase } from "@/data/types";
import { ensureSecurityIndexes } from "@/lib/auth-utils";
import { checkRate, getClientIp } from "@/lib/rate-limit";

type GiftDoc = {
  purchases: Purchase[];
  singlePurchase?: boolean;
  status?: "available" | "reserved" | "purchased" | "claimed";
  buyerType?: string | null;
  buyerName?: string | null;
  buyerNames?: string[] | null;
  claimedBy?: string | null;
  claimedAt?: string | null;
  reservedAt?: string | null;
  paymentId?: string | null;
  updatedAt?: string;
};

const MAX_BUYER_NAMES = 20;
const MAX_NAME_LENGTH = 80;
const MAX_BODY_BYTES = 8 * 1024;
const RATE_MAX = 10;
const RATE_WINDOW_SECONDS = 10 * 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureSecurityIndexes();

  const ip = getClientIp(request);
  const rate = await checkRate({
    key: `${ip}:claim`,
    max: RATE_MAX,
    windowSeconds: RATE_WINDOW_SECONDS,
  });
  if (!rate.allowed) {
    return Response.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Requisição muito grande." }, { status: 400 });
  }

  const { id } = await params;
  const body = await request.json();

  const buyerName = (body.buyerName as string)?.trim();
  const buyerType = body.buyerType as string;
  const buyerNames = body.buyerNames as string[] | undefined;

  if (!buyerName) {
    return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  if (buyerName.length > MAX_NAME_LENGTH) {
    return Response.json({ error: "Nome muito longo." }, { status: 400 });
  }

  if (!["individual", "couple", "group"].includes(buyerType)) {
    return Response.json({ error: "Tipo de comprador inválido." }, { status: 400 });
  }

  if (buyerNames !== undefined) {
    if (!Array.isArray(buyerNames)) {
      return Response.json({ error: "Lista de nomes inválida." }, { status: 400 });
    }
    if (buyerNames.length > MAX_BUYER_NAMES) {
      return Response.json({ error: "Muitos nomes informados." }, { status: 400 });
    }
    if (buyerNames.some((n) => typeof n !== "string" || n.length > MAX_NAME_LENGTH)) {
      return Response.json({ error: "Algum nome é inválido." }, { status: 400 });
    }
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
  const collection = client.db("carol-joao").collection<GiftDoc>("gifts");

  const gift = await collection.findOne({ _id: objectId });
  if (!gift) {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const purchase: Purchase = {
    source: "claim",
    buyerType: buyerType as Purchase["buyerType"],
    buyerName,
    buyerNames: buyerNames ?? [buyerName],
    paymentId: null,
    purchasedAt: now,
  };

  if (gift.singlePurchase === true) {
    const result = await collection.findOneAndUpdate(
      { _id: objectId, status: "available" },
      {
        $set: {
          status: "claimed",
          buyerType,
          buyerName,
          buyerNames: buyerNames ?? [buyerName],
          claimedBy: buyerName,
          claimedAt: now,
          updatedAt: now,
        },
        $push: { purchases: purchase },
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

  await collection.updateOne(
    { _id: objectId },
    {
      $push: { purchases: purchase },
      $set: { updatedAt: now },
    },
  );

  return Response.json({ success: true });
}
