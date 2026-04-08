import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI não configurada");
  }
  if (cachedClient) return cachedClient;
  cachedClient = await new MongoClient(process.env.MONGODB_URI).connect();
  return cachedClient;
}
