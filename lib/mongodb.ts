import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

/**
 * MONGODB_URI CONFIGURATION FOR VERCEL
 * =====================================
 * 
 * Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
 * 
 * IMPORTANT: Special characters in your password MUST be URL-encoded:
 *   @ -> %40
 *   : -> %3A
 *   / -> %2F
 *   ? -> %3F
 *   # -> %23
 *   [ -> %5B
 *   ] -> %5D
 *   % -> %25
 *   $ -> %24
 *   & -> %26
 *   + -> %2B
 *   , -> %2C
 *   ; -> %3B
 *   = -> %3D
 *   space -> %20
 * 
 * Example: If your password is "pass@word!" you should encode it as "pass%40word!"
 * 
 * The "bad auth" error typically means:
 * 1. Password contains special characters that aren't URL-encoded
 * 2. Username or password is incorrect
 * 3. The database user doesn't have access to the specified database
 * 
 * To fix "bad auth" in Vercel:
 * 1. Go to your Vercel project settings -> Environment Variables
 * 2. Delete the existing MONGODB_URI
 * 3. Add it again with the properly URL-encoded password
 * 4. Redeploy the project
 */

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
  serverSelectionTimeoutMS: 15000, // Increased for reliability
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  // Retry settings
  retryWrites: true,
  retryReads: true,
  // TLS settings for compatibility (fixes SSL alert number 80)
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
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
  
  // Log a sanitized version of the URI for debugging (hide password)
  const sanitizedUri = uri.replace(/:([^:@]+)@/, ':***@');
  console.log("[v0] Sanitized MongoDB URI:", sanitizedUri);

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
      
      // Provide helpful guidance for common errors
      if (error.message?.includes("bad auth") || error.code === 8000) {
        console.error("[v0] BAD AUTH ERROR - This usually means:");
        console.error("[v0]   1. Password has special characters that need URL encoding");
        console.error("[v0]   2. Username or password is incorrect");
        console.error("[v0]   3. Database user doesn't have proper permissions");
        console.error("[v0] See lib/mongodb.ts for password encoding instructions.");
      }
      
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
