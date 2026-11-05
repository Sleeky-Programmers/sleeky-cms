import { MongoClient, MongoServerSelectionError, MongoTopologyClosedError } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";
import { reconnectAfterFailures } from "./db";

// Nothing listens on port 1, so every connection attempt fails quickly.
const unreachable = () => new MongoClient("mongodb://127.0.0.1:1/test", { serverSelectionTimeoutMS: 300 });

describe("MongoDB client recovery", () => {
  const clients: MongoClient[] = [];
  afterEach(async () => {
    await Promise.all(clients.splice(0).map((client) => client.close()));
  });

  it("shows the problem: without the fix, a failed first connection breaks every later operation", async () => {
    const client = unreachable();
    clients.push(client);
    await expect(client.db().collection("x").findOne({})).rejects.toBeInstanceOf(MongoServerSelectionError);
    await expect(client.db().collection("x").findOne({})).rejects.toBeInstanceOf(MongoTopologyClosedError);
  });

  it("tries to connect again on the next operation", async () => {
    const client = reconnectAfterFailures(unreachable());
    clients.push(client);
    await expect(client.db().collection("x").findOne({})).rejects.toBeInstanceOf(MongoServerSelectionError);
    // A fresh attempt (still failing here, as nothing is listening), not "Topology is closed".
    await expect(client.db().collection("x").findOne({})).rejects.toBeInstanceOf(MongoServerSelectionError);
  });

  it("stays closed after an explicit close", async () => {
    const client = reconnectAfterFailures(unreachable());
    await client.close();
    await expect(client.db().collection("x").findOne({})).rejects.toThrow(/must be connected/);
  });
});
