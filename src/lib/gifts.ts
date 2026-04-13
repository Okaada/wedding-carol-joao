import { getMongoClient } from "@/lib/mongodb";

const RESERVATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function releaseExpiredReservations() {
  const client = await getMongoClient();
  const cutoff = new Date(Date.now() - RESERVATION_TIMEOUT_MS).toISOString();

  await client
    .db("carol-joao")
    .collection("gifts")
    .updateMany(
      {
        status: "reserved",
        reservedAt: { $lt: cutoff },
      },
      {
        $set: {
          status: "available",
          reservedAt: null,
          claimedBy: null,
          claimedAt: null,
          updatedAt: new Date().toISOString(),
        },
      },
    );
}
