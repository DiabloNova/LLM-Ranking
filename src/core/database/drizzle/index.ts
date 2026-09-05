import { drizzle } from "drizzle-orm/node-postgres";
import { TenantDbClient } from "../tenant-context";

// Small wrapper that acts as an adapter for Drizzle NodePgClient
export function createDrizzle(client: TenantDbClient) {
  // We type-cast it safely here because `client` wraps a PoolClient under the hood,
  // and Drizzle uses only the `query` method (which we mock/proxy appropriately).
  // The actual tenant-scoping is handled inside `client.query`.
  return drizzle(client as unknown as import("pg").PoolClient);
}
