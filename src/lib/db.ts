import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env";

// One MongoClient per server instance. In development the module is re-evaluated
// on every hot reload, so the client is kept on globalThis to avoid piling up
// connections. The client connects lazily on its first operation.
const globalForMongo = globalThis as typeof globalThis & {
  __sleekyMongoClient?: MongoClient;
  __sleekyMongoDnsPatched?: boolean;
};

/**
 * Some machines' local DNS refuses the SRV/TXT lookups that mongodb+srv://
 * addresses need ("querySrv ECONNREFUSED"). With MONGODB_DNS_SERVERS set, just
 * those lookups go through a dedicated resolver; all other DNS is untouched.
 * (Changing the process-wide servers isn't reliable inside the Next.js server.)
 */
function routeMongoDnsThrough(servers: string[]) {
  if (globalForMongo.__sleekyMongoDnsPatched) return;
  const resolver = new dns.promises.Resolver();
  resolver.setServers(servers);
  const original = dns.promises.resolve;
  (dns.promises as { resolve: unknown }).resolve = (hostname: string, rrtype?: string) =>
    rrtype === "SRV" || rrtype === "TXT"
      ? resolver.resolve(hostname, rrtype)
      : original(hostname, rrtype as Parameters<typeof original>[1]);
  globalForMongo.__sleekyMongoDnsPatched = true;
}

export function mongoClient(): MongoClient {
  if (!globalForMongo.__sleekyMongoClient) {
    const { MONGODB_URI, MONGODB_DNS_SERVERS } = env();
    if (MONGODB_DNS_SERVERS) routeMongoDnsThrough(MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()));
    globalForMongo.__sleekyMongoClient = new MongoClient(MONGODB_URI, { appName: "sleeky-cms" });
  }
  return globalForMongo.__sleekyMongoClient;
}

/** The CMS database: MONGODB_DB if set, otherwise the database named in MONGODB_URI. */
export function db(): Db {
  return mongoClient().db(env().MONGODB_DB);
}
