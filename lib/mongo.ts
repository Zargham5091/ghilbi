import { MongoClient, type Db } from "mongodb";

const g = globalThis as unknown as { _mongoClient?: Promise<MongoClient> };

export function hasDb(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

/** Cached connection: reused across warm serverless invocations (Netlify). */
export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!g._mongoClient) {
    g._mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 5 })
      .connect()
      .catch((e) => {
        g._mongoClient = undefined;
        throw e;
      });
  }
  const client = await g._mongoClient;
  return client.db(process.env.MONGODB_DB || "ghibli_anniversary");
}
