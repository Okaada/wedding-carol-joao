import { getMongoClient } from "./mongodb";

const DB_NAME = "carol-joao";
const COLLECTION = "write_rate_limits";

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (!xff) return "unknown";
  const first = xff.split(",")[0]?.trim();
  return first || "unknown";
}

export async function checkRate({
  key,
  max,
  windowSeconds,
}: {
  key: string;
  max: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; count: number }> {
  const client = await getMongoClient();
  const col = client.db(DB_NAME).collection(COLLECTION);

  const cutoff = new Date(Date.now() - windowSeconds * 1000);

  const doc = await col.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { firstHit: new Date() },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (doc && doc.firstHit instanceof Date && doc.firstHit < cutoff) {
    await col.updateOne(
      { key },
      { $set: { count: 1, firstHit: new Date() } },
    );
    return { allowed: true, count: 1 };
  }

  const count = (doc?.count as number) ?? 1;
  return { allowed: count <= max, count };
}

export async function countActiveReservationsByIp(
  ip: string,
  windowSeconds: number,
): Promise<number> {
  const client = await getMongoClient();
  const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();
  return client
    .db(DB_NAME)
    .collection("pending_payments")
    .countDocuments({
      ip,
      status: "pending",
      createdAt: { $gte: cutoff },
    });
}
