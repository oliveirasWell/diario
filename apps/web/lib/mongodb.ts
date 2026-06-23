import { MongoClient } from "mongodb";

const options = {};
let globalPromise: Promise<MongoClient> | undefined;

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI as string | undefined;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (process.env.NODE_ENV === "development") {
    const g = globalThis as any;
    if (!g._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      g._mongoClientPromise = client.connect();
    }
    return g._mongoClientPromise as Promise<MongoClient>;
  }
  if (!globalPromise) {
    const client = new MongoClient(uri, options);
    globalPromise = client.connect();
  }
  return globalPromise;
}

export default getMongoClientPromise;
