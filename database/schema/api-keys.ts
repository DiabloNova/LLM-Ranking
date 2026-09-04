import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  pgPolicy
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { organizations } from "./organization";

const defaultUuid = sql`gen_random_uuid()`;
const defaultNow = sql`NOW()`;

function tenantPolicy(colName: "organization_id" | "tenant_id" = "organization_id") {
  return [
    pgPolicy(`select_${colName}_isolation_policy`, {
      for: "select",
      using: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    }),
    pgPolicy(`insert_${colName}_isolation_policy`, {
      for: "insert",
      withCheck: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    }),
    pgPolicy(`update_${colName}_isolation_policy`, {
      for: "update",
      using: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`,
      withCheck: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    }),
    pgPolicy(`delete_${colName}_isolation_policy`, {
      for: "delete",
      using: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    })
  ];
}

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prefix: text("prefix").notNull().unique(), // The prefix used to identify the key
  hash: text("hash").notNull(), // The securely hashed secret
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [
  index("idx_api_keys_organization").on(table.organizationId),
  index("idx_api_keys_prefix").on(table.prefix),
  ...tenantPolicy("organization_id")
]);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));
