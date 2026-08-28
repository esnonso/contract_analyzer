import { MongoClient } from "mongodb";

const uri = process.env.MONGO_DB_URI;

if (!uri) {
  throw new Error("MONGO_DB_URI is not configured.");
}

const mongoUri = uri;

export async function getDatabase() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return client.db();
}