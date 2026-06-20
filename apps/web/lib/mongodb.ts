import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

const options = {};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
