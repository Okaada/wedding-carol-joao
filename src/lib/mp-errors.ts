import { getMongoClient } from "@/lib/mongodb";

export async function logMpError(giftId: string, error: string) {
  const client = await getMongoClient();
  await client
    .db("carol-joao")
    .collection("mp_errors")
    .insertOne({
      giftId,
      error,
      createdAt: new Date().toISOString(),
    });
}

export async function getTodayMpErrorCount(): Promise<number> {
  const client = await getMongoClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  return client
    .db("carol-joao")
    .collection("mp_errors")
    .countDocuments({
      createdAt: { $gte: todayStart.toISOString() },
    });
}
