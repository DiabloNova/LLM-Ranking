import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  pgPolicy
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { organizations, users } from "./organization";

const defaultUuid = sql`gen_random_uuid()`;
const defaultNow = sql`NOW()`;

function tenantPolicy(colName: "workspace_id" = "workspace_id") {
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

export const audits = pgTable("audits", {
  id: uuid("id").primaryKey().default(defaultUuid),
  workspaceId: uuid("workspace_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  rawSignals: jsonb("raw_signals"),
  aiInsights: jsonb("ai_insights"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_audits_workspace").on(table.workspaceId),
  index("idx_audits_user").on(table.userId),
  index("idx_audits_status").on(table.status),
  ...tenantPolicy("workspace_id")
]);

export const auditsRelations = relations(audits, ({ one }) => ({
  workspace: one(organizations, {
    fields: [audits.workspaceId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
}));
