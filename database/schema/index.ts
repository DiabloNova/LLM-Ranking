import { organizations } from "./organization";
export * from "./organization";
export * from "./api-keys";
export * from "./audits";
export * from "./webhook-events";
// NOTE: `credits` and `credit-transactions` standalone schema files were deleted.
// They modeled a `credits` table that was never migrated into the database and a
// `credit_transactions` shape that collided with (and did not match the columns of)
// the real, migrated `credit_transactions` table defined inline below. The real credit
// ledger is `tenant_quotas.credits_balance` + the inline `creditTransactions` export
// further down this file, both of which are backed by an actual migration. See
// `src/features/billing/services/subscription-service.ts` for the only correct way to
// read or mutate tenant credit balances.
import {
  pgTable,
  AnyPgColumn,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  jsonb,
  customType,
  primaryKey,
  uniqueIndex,
  index,
  check,
  bigint,
  pgPolicy
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom vector type for pgvector
const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(768)";
  },
});

// Helper for default gen_random_uuid()
const defaultUuid = sql`gen_random_uuid()`;
const defaultNow = sql`NOW()`;

// RLS Policy Helper for tenant isolation based on organization_id / tenant_id
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

function textTenantPolicy() {
  return [
    pgPolicy(`crawl_tenant_policy`, {
      for: "all",
      using: sql`tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')`,
      withCheck: sql`tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')`
    })
  ];
}

// ==========================================
// 1. ORGANIZATIONS
// ==========================================


// 1.1 USERS & MEMBERSHIPS (WORKSPACE MODEL)
// ==========================================



// ==========================================
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(defaultUuid),
  name: text("name").notNull().unique(),
  hierarchyRank: integer("hierarchy_rank").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_roles_name").on(table.name),
]);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_permissions_role_id").on(table.roleId),
]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(defaultUuid),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  roleId: uuid("role_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_admin_users_email").on(table.email),
  index("idx_admin_users_deleted_at").on(table.deletedAt).where(sql`deleted_at IS NULL`),
]);

export const auditRecords = pgTable("audit_records", {
  id: uuid("id").primaryKey().default(defaultUuid),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().default(defaultNow),
  actorId: text("actor_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  payloadBefore: text("payload_before"),
  payloadAfter: text("payload_after"),
  status: text("status").notNull(),
  errorDetails: text("error_details"),
}, (table) => [
  index("idx_audit_records_actor").on(table.actorId),
  index("idx_audit_records_resource").on(table.resourceType, table.resourceId),
  index("idx_audit_records_timestamp").on(table.timestamp),
]);

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().default(defaultUuid),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isEnabledGlobally: boolean("is_enabled_globally").notNull().default(false),
  tenantOverrides: text("tenant_overrides").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_feature_flags_key").on(table.key),
]);

export const systemConfigurations = pgTable("system_configurations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull(),
  isEncrypted: boolean("is_encrypted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_system_configurations_key").on(table.key),
]);

export const tenantQuotas = pgTable("tenant_quotas", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxBrands: integer("max_brands").notNull(),
  maxPrompts: integer("max_prompts").notNull(),
  maxObservationsPerMonth: integer("max_observations_per_month").notNull(),
  maxCrawlJobsPerDay: integer("max_crawl_jobs_per_day").notNull(),
  monthlyTokenLimit: integer("monthly_token_limit").notNull(),
  monthlyCostLimitUsd: integer("monthly_cost_limit_usd").notNull(),
  usedObservationsThisMonth: integer("used_observations_this_month").notNull().default(0),
  usedTokensThisMonth: integer("used_tokens_this_month").notNull().default(0),
  usedCrawlJobsToday: integer("used_crawl_jobs_today").notNull().default(0),
  creditsBalance: integer("credits_balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_tenant_quotas_tenant").on(table.tenantId),
  ...tenantPolicy("tenant_id")
]);

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull(),
  amount: integer("amount").notNull(),
  transactionType: text("transaction_type").notNull(), // allocation, consumption, refund
  description: text("description"),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_credit_transactions_tenant").on(table.tenantId),
  ...tenantPolicy("tenant_id")
]);

export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  billingCycle: text("billing_cycle").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  priceAmount: integer("price_amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_tenant_subscriptions_tenant").on(table.tenantId),
  ...tenantPolicy("tenant_id")
]);

export const aiProviderConfigs = pgTable("ai_provider_configs", {
  id: uuid("id").primaryKey().default(defaultUuid),
  providerName: text("provider_name").notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  apiKeyMasked: text("api_key_masked").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  failoverProviderId: uuid("failover_provider_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_ai_provider_configs_active").on(table.isActive),
]);

// ==========================================
// 3. BRANDS & ENTITIES
// ==========================================
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  canonicalDomain: text("canonical_domain").notNull(),
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  industry: text("industry").notNull(),
  targetMarkets: text("target_markets").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_brands_organization").on(table.organizationId),
  index("idx_brands_domain").on(table.canonicalDomain),
  ...tenantPolicy("organization_id")
]);

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  entityType: text("entity_type").notNull(),
  description: text("description"),
  properties: jsonb("properties").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_entities_organization").on(table.organizationId),
  index("idx_entities_type").on(table.entityType),
  ...tenantPolicy("organization_id")
]);

export const entityRelationships = pgTable("entity_relationships", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceEntityId: uuid("source_entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  targetEntityId: uuid("target_entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(),
  weight: doublePrecision("weight").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_entity_relationships_org").on(table.organizationId),
  index("idx_entity_relationships_source").on(table.sourceEntityId),
  index("idx_entity_relationships_target").on(table.targetEntityId),
  ...tenantPolicy("organization_id")
]);

// ==========================================
// 4. UNIFIED INTELLIGENCE & WEBSITE DOMAIN
// ==========================================
export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  normalizedUrl: text("normalized_url").notNull(),
  status: text("status").notNull().default("active"),
  cmsType: text("cms_type"),
  lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true }),
  lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_websites_organization").on(table.organizationId),
  uniqueIndex("idx_websites_domain_org").on(table.organizationId, table.domain).where(sql`deleted_at IS NULL`),
  ...tenantPolicy("organization_id")
]);

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  normalizedUrl: text("normalized_url").notNull(),
  path: text("path").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  httpStatus: integer("http_status").notNull().default(200),
  contentType: text("content_type"),
  contentHash: text("content_hash"),
  wordCount: integer("word_count").notNull().default(0),
  canonicalUrl: text("canonical_url"),
  robotsDirectives: text("robots_directives").array().notNull().default(sql`'{}'::text[]`),
  inlinkCount: integer("inlink_count").notNull().default(0),
  outlinkCount: integer("outlink_count").notNull().default(0),
  lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_pages_organization").on(table.organizationId),
  index("idx_pages_website").on(table.websiteId),
  uniqueIndex("idx_pages_url_org").on(table.organizationId, table.normalizedUrl).where(sql`deleted_at IS NULL`),
  ...tenantPolicy("organization_id")
]);

export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  normalizedTerm: text("normalized_term").notNull(),
  language: text("language").notNull().default("en"),
  intent: text("intent"),
  searchVolume: integer("search_volume"),
  cpc: doublePrecision("cpc"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_keywords_organization").on(table.organizationId),
  uniqueIndex("idx_keywords_term_org").on(table.organizationId, table.normalizedTerm).where(sql`deleted_at IS NULL`),
  ...tenantPolicy("organization_id")
]);

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull().default("en"),
  parentTopicId: uuid("parent_topic_id").references((): AnyPgColumn => topics.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_topics_organization").on(table.organizationId),
  uniqueIndex("idx_topics_name_org").on(table.organizationId, table.name).where(sql`deleted_at IS NULL`),
  ...tenantPolicy("organization_id")
]);

export const competitors = pgTable("competitors", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  normalizedUrl: text("normalized_url").notNull(),
  isDirect: boolean("is_direct").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_competitors_organization").on(table.organizationId),
  uniqueIndex("idx_competitors_domain_org").on(table.organizationId, table.domain).where(sql`deleted_at IS NULL`),
  ...tenantPolicy("organization_id")
]);

export const historicalMetrics = pgTable("historical_metrics", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: doublePrecision("metric_value").notNull(),
  dimensions: jsonb("dimensions").notNull().default({}),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().default(defaultNow),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_historical_metrics_lookup").on(table.organizationId, table.entityType, table.entityId, table.metricName),
  index("idx_historical_metrics_time").on(table.recordedAt),
  ...tenantPolicy("organization_id")
]);

export const pagesKeywords = pgTable("pages_keywords", {
  pageId: uuid("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  keywordId: uuid("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  primaryKey({ columns: [table.pageId, table.keywordId] }),
  index("idx_pages_keywords_org").on(table.organizationId),
]);

export const pagesTopics = pgTable("pages_topics", {
  pageId: uuid("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  score: doublePrecision("score").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  primaryKey({ columns: [table.pageId, table.topicId] }),
  index("idx_pages_topics_org").on(table.organizationId),
]);

export const pagesEntities = pgTable("pages_entities", {
  pageId: uuid("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  entityId: uuid("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  salience: doublePrecision("salience").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  primaryKey({ columns: [table.pageId, table.entityId] }),
  index("idx_pages_entities_org").on(table.organizationId),
]);

export const keywordsTopics = pgTable("keywords_topics", {
  keywordId: uuid("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  primaryKey({ columns: [table.keywordId, table.topicId] }),
  index("idx_keywords_topics_org").on(table.organizationId),
]);

export const topicsEntities = pgTable("topics_entities", {
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  entityId: uuid("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  primaryKey({ columns: [table.topicId, table.entityId] }),
  index("idx_topics_entities_org").on(table.organizationId),
]);

// ==========================================
// 5. DIAGNOSTICS
// ==========================================
export const diagnosticFindings = pgTable("diagnostic_findings", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  findingType: text("finding_type").notNull(),
  severity: text("severity").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidence: jsonb("evidence").notNull().default({}),
  recommendation: text("recommendation").notNull(),
  impactScore: integer("impact_score").notNull().default(0),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_diagnostic_findings_org").on(table.organizationId),
  index("idx_diagnostic_findings_domain").on(table.domain),
  index("idx_diagnostic_findings_status").on(table.status),
  ...tenantPolicy("organization_id")
]);

export const diagnosticFindingRelationships = pgTable("diagnostic_finding_relationships", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  parentFindingId: uuid("parent_finding_id").notNull().references(() => diagnosticFindings.id, { onDelete: "cascade" }),
  childFindingId: uuid("child_finding_id").notNull().references(() => diagnosticFindings.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_diagnostic_rel_org").on(table.organizationId),
  index("idx_diagnostic_rel_parent").on(table.parentFindingId),
  index("idx_diagnostic_rel_child").on(table.childFindingId),
  ...tenantPolicy("organization_id")
]);

// ==========================================
// 6. PROMPTS & AI ENGINES
// ==========================================
export const aiEngines = pgTable("ai_engines", {
  id: uuid("id").primaryKey().default(defaultUuid),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  version: text("version").notNull(),
  capabilities: text("capabilities").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  versionNum: integer("version_num").notNull().default(1),
});

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  category: text("category").notNull(),
  buyingIntent: text("buying_intent").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_prompts_organization").on(table.organizationId),
  index("idx_prompts_brand").on(table.brandId),
  ...tenantPolicy("organization_id")
]);

export const promptDefinitions = pgTable("prompt_definitions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  category: text("category").notNull(),
  intent: text("intent").notNull(),
  locale: text("locale").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  variables: jsonb("variables").notNull(),
  competitors: text("competitors").array().notNull(),
  tags: text("tags").array().notNull(),
  notes: text("notes"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  optVersion: integer("opt_version").notNull().default(1),
}, (table) => [
  index("idx_prompt_definitions_tenant").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

export const promptSchedules = pgTable("prompt_schedules", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  promptId: uuid("prompt_id").notNull().references(() => promptDefinitions.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  cronExpression: text("cron_expression").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  nextExecutionAt: timestamp("next_execution_at", { withTimezone: true }),
  lastExecutionAt: timestamp("last_execution_at", { withTimezone: true }),
  status: text("status").notNull().default("IDLE"),
  failureReason: text("failure_reason"),
  scheduleVersion: integer("schedule_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_prompt_schedules_tenant").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

export const promptExecutions = pgTable("prompt_executions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  promptId: uuid("prompt_id").notNull().references(() => promptDefinitions.id, { onDelete: "cascade" }),
  promptVersion: integer("prompt_version").notNull(),
  resolvedPromptText: text("resolved_prompt_text").notNull(),
  variablesValues: jsonb("variables_values").notNull(),
  status: text("status").notNull().default("queued"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  modelVersion: text("model_version"),
  responseText: text("response_text"),
  latencyMs: integer("latency_ms"),
  errorMessage: text("error_message"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_prompt_executions_tenant").on(table.organizationId),
  index("idx_prompt_executions_status").on(table.status),
  check("prompt_executions_status_check", sql`status IN ('queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled')`),
  ...tenantPolicy("organization_id")
]);

export const positionObservations = pgTable("position_observations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceExecutionId: uuid("source_execution_id").notNull().references(() => promptExecutions.id, { onDelete: "cascade" }),
  subjectEntityId: text("subject_entity_id").notNull(),
  presence: text("presence").notNull(),
  numericPosition: integer("numeric_position"),
  evidenceExcerpt: text("evidence_excerpt").notNull(),
  evidenceStructure: text("evidence_structure").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  analyzerVersion: text("analyzer_version").notNull().default("1.0.0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_position_obs_tenant").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

// ==========================================
// 7. OBSERVATIONS & CITATIONS
// ==========================================
export const aiObservations = pgTable("ai_observations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  engineId: uuid("engine_id").notNull().references(() => aiEngines.id, { onDelete: "cascade" }),
  rawResponseText: text("raw_response_text").notNull(),
  parsedSentiment: text("parsed_sentiment").notNull(),
  positionRank: integer("position_rank"),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().default(defaultNow),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_ai_observations_organization").on(table.organizationId),
  index("idx_ai_observations_prompt").on(table.promptId),
  index("idx_ai_observations_engine").on(table.engineId),
  ...tenantPolicy("organization_id")
]);

export const competitorMentions = pgTable("competitor_mentions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  observationId: uuid("observation_id").notNull().references(() => aiObservations.id, { onDelete: "cascade" }),
  competitorId: uuid("competitor_id").notNull().references(() => competitors.id, { onDelete: "cascade" }),
  mentionContext: text("mention_context").notNull(),
  isRecommended: boolean("is_recommended").notNull().default(false),
  sentimentScore: doublePrecision("sentiment_score").notNull().default(0.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_competitor_mentions_organization").on(table.organizationId),
  index("idx_competitor_mentions_observation").on(table.observationId),
  index("idx_competitor_mentions_competitor").on(table.competitorId),
  ...tenantPolicy("organization_id")
]);

export const brandMentions = pgTable("brand_mentions", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  observationId: uuid("observation_id").notNull().references(() => aiObservations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  mentionContext: text("mention_context").notNull(),
  isRecommended: boolean("is_recommended").notNull().default(false),
  sentimentScore: doublePrecision("sentiment_score").notNull().default(0.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_brand_mentions_organization").on(table.organizationId),
  index("idx_brand_mentions_brand").on(table.brandId),
  ...tenantPolicy("organization_id")
]);

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  observationId: uuid("observation_id").notNull().references(() => aiObservations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  anchorText: text("anchor_text"),
  citationOrder: integer("citation_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_citations_organization").on(table.organizationId),
  index("idx_citations_observation").on(table.observationId),
  index("idx_citations_domain").on(table.domain),
  ...tenantPolicy("organization_id")
]);

export const citationSources = pgTable("citation_sources", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  publisherName: text("publisher_name"),
  publisherCategory: text("publisher_category").notNull().default("General"),
  authorityScore: integer("authority_score").notNull().default(50),
  isVerifiedDomain: boolean("is_verified_domain").notNull().default(false),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_citation_sources_tenant").on(table.organizationId),
  uniqueIndex("idx_citation_sources_url_org").on(table.organizationId, table.url),
  ...tenantPolicy("organization_id")
]);

export const citationOccurrences = pgTable("citation_occurrences", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => citationSources.id, { onDelete: "cascade" }),
  engineId: text("engine_id").notNull(),
  promptText: text("prompt_text").notNull(),
  citationPosition: integer("citation_position").notNull().default(1),
  excerptText: text("excerpt_text"),
  sentimentScore: doublePrecision("sentiment_score").notNull().default(0.0),
  isBrandMentioned: boolean("is_brand_mentioned").notNull().default(false),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().default(defaultNow),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_citation_occurrences_tenant").on(table.organizationId),
  index("idx_citation_occurrences_source").on(table.sourceId),
  ...tenantPolicy("organization_id")
]);

// ==========================================
// 8. BRAND INTELLIGENCE & AUDITS
// ==========================================
export const visibilityScores = pgTable("visibility_scores", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  engineId: uuid("engine_id").notNull().references(() => aiEngines.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  presenceRate: doublePrecision("presence_rate").notNull(),
  avgPosition: doublePrecision("avg_position"),
  netSentiment: doublePrecision("net_sentiment").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().default(defaultNow),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_visibility_scores_organization").on(table.organizationId),
  index("idx_visibility_scores_brand").on(table.brandId),
  ...tenantPolicy("organization_id")
]);

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  impactScore: integer("impact_score").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionPlan: jsonb("action_plan").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_recommendations_organization").on(table.organizationId),
  index("idx_recommendations_brand").on(table.brandId),
  ...tenantPolicy("organization_id")
]);

export const brandAssociations = pgTable("brand_associations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  attributeName: text("attribute_name").notNull(),
  associationScore: doublePrecision("association_score").notNull().default(0.0),
  mentionCount: integer("mention_count").notNull().default(0),
  sampleExcerpts: text("sample_excerpts").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_brand_associations_tenant").on(table.organizationId),
  index("idx_brand_associations_brand").on(table.brandId),
  ...tenantPolicy("organization_id")
]);

export const recommendationObservations = pgTable("recommendation_observations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  engineId: text("engine_id").notNull(),
  frequency: integer("frequency").notNull().default(1),
  confidenceScore: doublePrecision("confidence_score").notNull().default(0.0),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_recommendation_obs_tenant").on(table.organizationId),
  index("idx_recommendation_obs_brand").on(table.brandId),
  ...tenantPolicy("organization_id")
]);

export const aiVisibilityAudits = pgTable("ai_visibility_audits", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  targetBrandName: text("target_brand_name").notNull(),
  targetDomain: text("target_domain").notNull(),
  overallScore: integer("overall_score").notNull(),
  brandAuthorityScore: integer("brand_authority_score").notNull(),
  aiSearchShareScore: integer("ai_search_share_score").notNull(),
  sentimentScore: integer("sentiment_score").notNull(),
  citationReliabilityScore: integer("citation_reliability_score").notNull(),
  recommendationShareScore: integer("recommendation_share_score").notNull(),
  dimensionsJson: jsonb("dimensions_json").notNull(),
  auditedEngineIds: text("audited_engine_ids").array().notNull(),
  auditedPromptsCount: integer("audited_prompts_count").notNull(),
  rawObservationsCount: integer("raw_observations_count").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_ai_vis_audits_org").on(table.organizationId),
  index("idx_ai_vis_audits_brand").on(table.targetBrandName),
  index("idx_ai_vis_audits_status").on(table.status),
  ...tenantPolicy("organization_id")
]);

export const auditPrompts = pgTable("audit_prompts", {
  id: uuid("id").primaryKey().default(defaultUuid),
  auditId: uuid("audit_id").notNull().references(() => aiVisibilityAudits.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  promptText: text("prompt_text").notNull(),
  category: text("category").notNull(),
  weight: doublePrecision("weight").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_audit_prompts_audit").on(table.auditId),
  index("idx_audit_prompts_org").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

export const premiumAudits = pgTable("premium_audits", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  grade: text("grade").notNull(),
  pagesAnalyzed: integer("pages_analyzed").notNull(),
  metrics: jsonb("metrics").notNull(),
  issues: jsonb("issues").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_premium_audits_organization").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

export const technicalAudits = pgTable("technical_audits", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull(),
  url: text("url").notNull(),
  technicalScore: integer("technical_score").notNull(),
  grade: text("grade").notNull(),
  pagesAnalyzed: integer("pages_analyzed").notNull(),
  categories: jsonb("categories").notNull(),
  criticalIssues: jsonb("critical_issues").notNull(),
  quickWins: jsonb("quick_wins").notNull(),
  performanceMetrics: jsonb("performance_metrics").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(defaultNow),
}, (table) => [
  index("idx_technical_audits_org").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

export const competitiveAnalyses = pgTable("competitive_analyses", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull(),
  userUrl: text("user_url").notNull(),
  competitorUrls: text("competitor_urls").array().notNull(),
  overallScore: integer("overall_score").notNull(),
  marketPosition: text("market_position").notNull(),
  comparisonData: jsonb("comparison_data").notNull(),
  advantages: jsonb("advantages").notNull(),
  gaps: jsonb("gaps").notNull(),
  opportunities: jsonb("opportunities").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(defaultNow),
}, (table) => [
  index("idx_competitive_analyses_org").on(table.organizationId),
  ...tenantPolicy("organization_id")
]);

// ==========================================
// 9. AEO CONTENT INTELLIGENCE
// ==========================================
export const aeoAnalyses = pgTable("aeo_analyses", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  overallAeoScore: integer("overall_aeo_score").notNull(),
  answerabilityScore: integer("answerability_score").notNull(),
  entityCoverageScore: integer("entity_coverage_score").notNull(),
  semanticCoverageScore: integer("semantic_coverage_score").notNull(),
  questionCoverageScore: integer("question_coverage_score").notNull(),
  citationReadinessScore: integer("citation_readiness_score").notNull(),
  structuredAnswerQualityScore: integer("structured_answer_quality_score").notNull(),
  analysisDetails: jsonb("analysis_details").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_aeo_analyses_tenant").on(table.tenantId),
  index("idx_aeo_analyses_url").on(table.url),
  ...tenantPolicy("tenant_id")
]);

export const faqOpportunities = pgTable("faq_opportunities", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  aeoAnalysisId: uuid("aeo_analysis_id").notNull().references(() => aeoAnalyses.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  userIntent: text("user_intent").notNull().default("Informational"),
  opportunityScore: integer("opportunity_score").notNull().default(50),
  suggestedAnswer: text("suggested_answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_faq_opps_tenant").on(table.tenantId),
  index("idx_faq_opps_analysis").on(table.aeoAnalysisId),
  ...tenantPolicy("tenant_id")
]);

export const kgAlignments = pgTable("kg_alignments", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  aeoAnalysisId: uuid("aeo_analysis_id").notNull().references(() => aeoAnalyses.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  entityType: text("entity_type").notNull(),
  wikidataId: text("wikidata_id"),
  alignmentStatus: text("alignment_status").notNull().default("unmapped"),
  confidence: doublePrecision("confidence").notNull().default(0.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_kg_alignments_tenant").on(table.tenantId),
  index("idx_kg_alignments_analysis").on(table.aeoAnalysisId),
  ...tenantPolicy("tenant_id")
]);


export const automatedRecommendations = pgTable("automated_recommendations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  websiteId: uuid("website_id").references(() => websites.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  priorityScore: integer("priority_score").notNull(),
  status: text("status").notNull().default("pending"),
  recommendedAction: jsonb("recommended_action").notNull().default({}),
  dedupKey: text("dedup_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_automated_recs_org").on(table.organizationId),
  index("idx_automated_recs_status").on(table.status),
  index("idx_automated_recs_score").on(table.priorityScore),
  uniqueIndex("idx_automated_recs_dedup").on(table.organizationId, table.dedupKey).where(sql`status = 'pending'`),
  ...tenantPolicy("organization_id")
]);

// ==========================================
// 10. COMPETITOR & COMPETITIVE FINDINGS
// ==========================================
export const competitorChanges = pgTable("competitor_changes", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  competitorId: uuid("competitor_id").notNull().references(() => competitors.id, { onDelete: "cascade" }),
  changeType: text("change_type").notNull(),
  severity: text("severity").notNull(),
  summary: text("summary").notNull(),
  details: jsonb("details").notNull().default({}),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().default(defaultNow),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_competitor_changes_tenant").on(table.tenantId),
  index("idx_competitor_changes_comp").on(table.competitorId),
  index("idx_competitor_changes_type").on(table.changeType),
  ...tenantPolicy("tenant_id")
]);

export const competitiveSeoFindings = pgTable("competitive_seo_findings", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  competitorId: uuid("competitor_id").references(() => competitors.id, { onDelete: "set null" }),
  findingType: text("finding_type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidence: jsonb("evidence").notNull().default({}),
  recommendation: text("recommendation").notNull(),
  impactScore: integer("impact_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_comp_seo_findings_tenant").on(table.tenantId),
  index("idx_comp_seo_findings_comp").on(table.competitorId),
  index("idx_comp_seo_findings_type").on(table.findingType),
  check("competitive_seo_findings_finding_type_check", sql`finding_type IN (
    'technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference',
    'ai_visibility_gap', 'citation_gap', 'prompt_gap', 'brand_mention_gap', 'ai_recommendation_gap', 'citation_overlap'
  )`),
  ...tenantPolicy("tenant_id")
]);

// ==========================================
// 11. KNOWLEDGE GRAPH & VECTOR STORE
// ==========================================
export const documentEmbeddings = pgTable("document_embeddings", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull(),
  contentChunk: text("content_chunk").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  embedding: vector("embedding").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_document_embeddings_tenant").on(table.tenantId),
  ...tenantPolicy("tenant_id")
]);

export const kgEntities = pgTable("kg_entities", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  properties: jsonb("properties").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_kg_entities_tenant").on(table.tenantId),
  index("idx_kg_entities_name").on(table.name),
  ...tenantPolicy("tenant_id")
]);

export const kgRelationships = pgTable("kg_relationships", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceEntityId: uuid("source_entity_id").notNull().references(() => kgEntities.id, { onDelete: "cascade" }),
  targetEntityId: uuid("target_entity_id").notNull().references(() => kgEntities.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(),
  properties: jsonb("properties").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  index("idx_kg_relationships_tenant").on(table.tenantId),
  index("idx_kg_relationships_source").on(table.sourceEntityId),
  index("idx_kg_relationships_target").on(table.targetEntityId),
  ...tenantPolicy("tenant_id")
]);

// ==========================================
// 12. CRAWL ACQUISITION & WORKER
// ==========================================
export const crawlJobs = pgTable("crawl_jobs", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: text("tenant_id").notNull(),
  requestedUrl: text("requested_url").notNull(),
  normalizedUrl: text("normalized_url").notNull(),
  policy: jsonb("policy").notNull(),
  dedupKey: text("dedup_key").notNull(),
  cacheKey: text("cache_key").notNull(),
  priority: integer("priority").notNull().default(0),
  status: text("status").notNull().default("PENDING"),
  providerId: text("provider_id"),
  providerJobId: text("provider_job_id"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  workerId: text("worker_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  pageCount: integer("page_count"),
  bytesProcessed: bigint("bytes_processed", { mode: "number" }),
  cacheOutcome: text("cache_outcome"),
  error: jsonb("error"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  cancellationRequestedBy: text("cancellation_requested_by"),
  resultRef: uuid("result_ref"),
  correlationId: text("correlation_id"),
  requestId: text("request_id"),
  traceId: text("trace_id"),
  version: integer("version").notNull().default(1),
}, (table) => [
  index("idx_crawl_jobs_tenant_status").on(table.tenantId, table.status),
  index("idx_crawl_jobs_status_scheduled").on(table.status, table.scheduledFor).where(sql`status = 'QUEUED'`),
  index("idx_crawl_jobs_provider_job_id").on(table.providerJobId),
  index("idx_crawl_jobs_tenant_created").on(table.tenantId, table.createdAt),
  uniqueIndex("idx_crawl_jobs_active_dedup").on(table.tenantId, table.dedupKey).where(sql`status IN ('PENDING', 'QUEUED', 'RUNNING')`),
  check("crawl_jobs_status_check", sql`status IN ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED')`),
  check("crawl_jobs_attempts_check", sql`attempts >= 0`),
  check("crawl_jobs_max_attempts_check", sql`max_attempts > 0`),
  check("crawl_jobs_cache_outcome_check", sql`cache_outcome IS NULL OR cache_outcome IN ('HIT', 'MISS', 'STALE', 'BYPASS')`),
  check("crawl_jobs_version_check", sql`version > 0`),
  ...textTenantPolicy()
]);

export const crawlResults = pgTable("crawl_results", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: text("tenant_id").notNull(),
  jobId: uuid("job_id").notNull().references(() => crawlJobs.id, { onDelete: "cascade" }),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  uniqueIndex("crawl_results_job_unique").on(table.jobId),
  uniqueIndex("crawl_results_tenant_job_unique").on(table.tenantId, table.jobId),
  ...textTenantPolicy()
]);

export const crawlCache = pgTable("crawl_cache", {
  id: uuid("id").primaryKey().default(defaultUuid),
  tenantId: text("tenant_id").notNull(),
  cacheScope: text("cache_scope").notNull().default("tenant"),
  cacheKey: text("cache_key").notNull(),
  normalizedResult: jsonb("normalized_result").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  uniqueIndex("idx_crawl_cache_key").on(table.tenantId, table.cacheScope, table.cacheKey),
  check("crawl_cache_scope_check", sql`cache_scope = 'tenant'`),
  ...textTenantPolicy()
]);

// Website Monitoring additions
export const monitoringConfigs = pgTable("monitoring_configs", {
  id: uuid("id").default(defaultUuid).primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  schedule: text("schedule").notNull(),
  crawlUrl: text("crawl_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow)
}, (table) => {
  return [
    index("idx_monitoring_configs_org_enabled").on(table.organizationId, table.enabled),
    ...tenantPolicy("organization_id")
  ];
});

export const crawlSnapshots = pgTable("crawl_snapshots", {
  id: uuid("id").default(defaultUuid).primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  monitoringConfigId: uuid("monitoring_config_id").notNull().references(() => monitoringConfigs.id, { onDelete: "cascade" }),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().default(defaultNow),
  pages: jsonb("pages").notNull(),
  totalPages: integer("total_pages").notNull(),
  indexablePages: integer("indexable_pages").notNull(),
  nonIndexablePages: integer("non_indexable_pages").notNull(),
  error4xxCount: integer("error_4xx_count").notNull(),
  error5xxCount: integer("error_5xx_count").notNull(),
  robotsTxtAvailable: boolean("robots_txt_available").notNull(),
  sitemapAvailable: boolean("sitemap_available").notNull()
}, (table) => {
  return [
    index("idx_crawl_snapshots_config_captured").on(table.monitoringConfigId, table.capturedAt),
    index("idx_crawl_snapshots_org").on(table.organizationId),
    ...tenantPolicy("organization_id")
  ];
});

export const monitoringAlerts = pgTable("monitoring_alerts", {
  id: uuid("id").default(defaultUuid).primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  monitoringConfigId: uuid("monitoring_config_id").notNull().references(() => monitoringConfigs.id, { onDelete: "cascade" }),
  snapshotId: uuid("snapshot_id").notNull().references(() => crawlSnapshots.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  type: text("type").notNull(),
  fingerprint: text("fingerprint").notNull(),
  url: text("url"),
  message: text("message").notNull(),
  previousValue: jsonb("previous_value"),
  currentValue: jsonb("current_value"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  resolvedAt: timestamp("resolved_at", { withTimezone: true })
}, (table) => {
  return [
    index("idx_monitoring_alerts_config_status").on(table.monitoringConfigId, table.status),
    index("idx_monitoring_alerts_fingerprint_status").on(table.fingerprint, table.status),
    uniqueIndex("idx_monitoring_alerts_open_fingerprint").on(table.fingerprint).where(sql`status = 'open'`),
    // Backs `SELECT * FROM monitoring_alerts WHERE organization_id = $1 AND status = 'open'`
    // in RecommendationEngineService.runDiagnosisForTenant, which previously had to rely
    // on a full table scan since no index led with organization_id.
    index("idx_monitoring_alerts_org_status").on(table.organizationId, table.status),
    ...tenantPolicy("organization_id")
  ];
});
