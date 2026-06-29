import { MongoClient } from "mongodb";

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI não configurada. Defina a variável de ambiente.");
    process.exit(1);
  }

  const client = await new MongoClient(uri).connect();
  const collection = client.db("carol-joao").collection("pending_payments");

  await collection.createIndex({ status: 1, createdAt: -1 });
  await collection.createIndex({ giftId: 1 });

  console.log("pending_payments indexes ensured.");

  await client.close();
}

migrate().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
