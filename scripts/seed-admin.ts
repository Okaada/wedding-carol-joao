import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI não configurada. Defina a variável de ambiente.");
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!email || !password) {
    console.error("Uso: npx tsx scripts/seed-admin.ts <email> <senha> [nome]");
    process.exit(1);
  }

  const client = await new MongoClient(uri).connect();
  const db = client.db("carol-joao");
  const collection = db.collection("admin_users");

  const existing = await collection.findOne({ email });
  if (existing) {
    console.log(`Usuário com email ${email} já existe.`);
    await client.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await collection.insertOne({
    email,
    passwordHash,
    name,
    createdAt: new Date().toISOString(),
  });

  console.log(`Admin criado: ${email} (${name})`);
  await client.close();
}

seed().catch((err) => {
  console.error("Erro ao criar admin:", err);
  process.exit(1);
});
