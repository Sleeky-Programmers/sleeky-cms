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

/**
 * Lets the client recover after its connection attempt fails.
 *
 * When connecting fails (network down, Wi-Fi waking up, Atlas unreachable), the
 * driver closes its internal topology but leaves it attached to the client. It
 * only connects again when there is no topology, so every later operation fails
 * with "Topology is closed" until the server restarts. Detaching the closed
 * topology makes the next operation connect afresh. The same client object is
 * kept, because Better Auth holds on to it.
 */
export function reconnectAfterFailures(client: MongoClient): MongoClient {
  type Internals = { topology?: { s?: { state?: string } } };
  client.on("topologyClosed", () => {
    const internals = client as unknown as Internals;
    // Only a topology that is fully closed (never one that is still connecting).
    // An explicit client.close() detaches it too, and then refuses to reconnect.
    if (internals.topology?.s?.state === "closed") internals.topology = undefined;
  });
  return client;
}

export function mongoClient(): MongoClient {
  if (!globalForMongo.__sleekyMongoClient) {
    const { MONGODB_URI, MONGODB_DNS_SERVERS } = env();
    if (MONGODB_DNS_SERVERS) routeMongoDnsThrough(MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()));
    globalForMongo.__sleekyMongoClient = reconnectAfterFailures(new MongoClient(MONGODB_URI, { appName: "sleeky-cms" }));
  }
  return globalForMongo.__sleekyMongoClient;
}

/** The CMS database: MONGODB_DB if set, otherwise the database named in MONGODB_URI. */
export function db(): Db {
  return mongoClient().db(env().MONGODB_DB);
}
