import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
  pgPolicy
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { apiKeys } from "./api-keys";
import { TableDefinition } from "./types";

const defaultUuid = sql`gen_random_uuid()`;
const defaultNow = sql`NOW()`;

function tenantPolicy(colName: "id" | "organization_id" | "tenant_id" = "organization_id") {
  const isId = colName === "id";
  const policyPrefix = isId ? "org" : colName;
  return [
    pgPolicy(`select_${policyPrefix}_isolation_policy`, {
      for: "select",
      using: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    }),
    pgPolicy(`insert_${policyPrefix}_isolation_policy`, {
      for: "insert",
      withCheck: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    }),
    pgPolicy(`update_${policyPrefix}_isolation_policy`, {
      for: "update",
      using: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`,
      withCheck: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    }),
    pgPolicy(`delete_${policyPrefix}_isolation_policy`, {
      for: "delete",
      using: sql`${sql.identifier(colName)} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
    })
  ];
}

// ----------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(defaultUuid),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  /**
   * scrypt credential in the format: scrypt$N$r$p$keylen$saltB64$hashB64
   * NULL means the account has no password credential and CANNOT authenticate via
   * email/password. Application code must never interpret NULL as "any password valid".
   * See src/lib/password.ts and migration 0019.
   */
  passwordHash: text("password_hash"),
  passwordUpdatedAt: timestamp("password_updated_at", { withTimezone: true }),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
}));

// ----------------------------------------------------------------------
// Organizations (Workspaces / Tenants)
// ----------------------------------------------------------------------
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  uniqueIndex("idx_organizations_slug").on(table.slug).where(sql`deleted_at IS NULL`),
  ...tenantPolicy("id")
]);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
  apiKeys: many(apiKeys),
}));

// ----------------------------------------------------------------------
// Organization Members
// ----------------------------------------------------------------------
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // super_admin, workspace_admin, viewer
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  uniqueIndex("idx_org_members_user_org").on(table.organizationId, table.userId),
  index("idx_org_members_user_id").on(table.userId),
  ...tenantPolicy("organization_id")
]);

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

// ----------------------------------------------------------------------
// Organization Invitations
// ----------------------------------------------------------------------
export const organizationInvitations = pgTable("organization_invitations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  uniqueIndex("idx_org_invitations_org_email").on(table.organizationId, table.email).where(sql`status = 'pending'`),
  index("idx_org_invitations_token").on(table.tokenHash),
  ...tenantPolicy("organization_id")
]);

export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id],
  }),
}));


// Keep the old metadata object if it was exported
export const organizationsTable: TableDefinition = {
  tableName: "organizations",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique identifier for the SaaS organization (tenant)"
    },
    {
      name: "name",
      type: "TEXT",
      nullable: false,
      description: "Commercial name of the organization"
    },
    {
      name: "slug",
      type: "TEXT",
      nullable: false,
      unique: true,
      description: "URL-friendly unique slug for routing"
    },
    {
      name: "plan",
      type: "TEXT",
      nullable: false,
      default: "'free'",
      description: "Subscription tier: 'free', 'growth', or 'enterprise'"
    },
    // Audit & Lifecycle columns
    {
      name: "created_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()",
      description: "Timestamp when the record was created"
    },
    {
      name: "updated_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()",
      description: "Timestamp when the record was last updated"
    },
    {
      name: "created_by",
      type: "TEXT",
      nullable: false,
      default: "'system'",
      description: "User or service that created the record"
    },
    {
      name: "updated_by",
      type: "TEXT",
      nullable: false,
      default: "'system'",
      description: "User or service that last updated the record"
    },
    {
      name: "deleted_at",
      type: "TIMESTAMP",
      nullable: true,
      description: "Timestamp when soft-deletion occurred"
    },
    {
      name: "version",
      type: "INTEGER",
      nullable: false,
      default: "1",
      description: "Optimistic locking version counter"
    }
  ],
  indexes: [
    "CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON organizations;
CREATE POLICY select_tenant_isolation_policy ON organizations
  FOR SELECT
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON organizations;
CREATE POLICY insert_tenant_isolation_policy ON organizations
  FOR INSERT
  WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON organizations;
CREATE POLICY update_tenant_isolation_policy ON organizations
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON organizations;
CREATE POLICY delete_tenant_isolation_policy ON organizations
  FOR DELETE
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
