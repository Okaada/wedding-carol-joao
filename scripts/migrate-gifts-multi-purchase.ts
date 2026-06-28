import { MongoClient } from "mongodb";

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI não configurada. Defina a variável de ambiente.");
    process.exit(1);
  }

  const client = await new MongoClient(uri).connect();
  const collection = client.db("carol-joao").collection("gifts");

  const singlePurchaseRes = await collection.updateMany(
    { singlePurchase: { $exists: false } },
    { $set: { singlePurchase: false } },
  );

  const purchasesRes = await collection.updateMany(
    { purchases: { $exists: false } },
    { $set: { purchases: [] } },
  );

  const unlockRes = await collection.updateMany(
    { status: { $in: ["reserved", "claimed"] } },
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

  console.log(`singlePurchase backfilled: ${singlePurchaseRes.modifiedCount}`);
  console.log(`purchases backfilled:      ${purchasesRes.modifiedCount}`);
  console.log(`unlocked reserved/claimed: ${unlockRes.modifiedCount}`);

  await client.close();
}

migrate().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
