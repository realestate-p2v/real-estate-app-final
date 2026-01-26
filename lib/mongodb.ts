import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "";

// Parse the URI to check if it already has query parameters
const hasQueryParams = uri.includes("?");

// Ensure the URI has recommended parameters for Atlas
function buildConnectionUri(baseUri: string): string {
  if (!baseUri) return baseUri;

  // If URI already has retryWrites and w, use as-is
  if (baseUri.includes("retryWrites") && baseUri.includes("w=majority")) {
    return baseUri;
  }

  // Add recommended parameters if missing
  const params: string[] = [];
  if (!baseUri.includes("retryWrites")) params.push("retryWrites=true");
  if (!baseUri.includes("w=majority")) params.push("w=majority");

  if (params.length === 0) return baseUri;

  const separator = hasQueryParams ? "&" : "?";
  return `${baseUri}${separator}${params.join("&")}`;
}

const connectionUri = buildConnectionUri(uri);

const options: MongoClientOptions = {
  // Connection settings optimized for serverless
  maxPoolSize: 1,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 10000, // Increased from 5000 for reliability
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  // Retry settings
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  console.log("[v0] Creating MongoDB client...");
  console.log("[v0] MongoDB URI configured:", !!uri);
  console.log("[v0] URI has query params:", hasQueryParams);

  const mongoClient = new MongoClient(connectionUri, options);

  return mongoClient.connect().then(
    (connectedClient) => {
      console.log("[v0] MongoDB connected successfully");
      return connectedClient;
    },
    (error) => {
      console.error("[v0] MongoDB connection failed:", error.message);
      console.error("[v0] MongoDB error name:", error.name);
      console.error("[v0] MongoDB error code:", error.code);
      throw error;
    }
  );
}

if (uri) {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createClientPromise();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    clientPromise = createClientPromise();
  }
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  if (!uri) {
    console.error("[v0] MONGODB_URI environment variable is not set");
    throw new Error("MONGODB_URI is not configured");
  }

  try {
    const connectedClient = await clientPromise;
    const db = connectedClient.db("photo2video");
    console.log("[v0] Database 'photo2video' accessed successfully");
    return db;
  } catch (error) {
    console.error("[v0] Failed to get database:", error);
    throw error;
  }
}
