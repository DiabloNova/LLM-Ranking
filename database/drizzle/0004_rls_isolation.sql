-- Migration to Enable and Force RLS

ALTER TABLE tenant_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_quotas FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON tenant_quotas;
CREATE POLICY "select_tenant_id_isolation_policy" ON tenant_quotas FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON tenant_quotas;
CREATE POLICY "insert_tenant_id_isolation_policy" ON tenant_quotas FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON tenant_quotas;
CREATE POLICY "update_tenant_id_isolation_policy" ON tenant_quotas FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON tenant_quotas;
CREATE POLICY "delete_tenant_id_isolation_policy" ON tenant_quotas FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON credit_transactions;
CREATE POLICY "select_tenant_id_isolation_policy" ON credit_transactions FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON credit_transactions;
CREATE POLICY "insert_tenant_id_isolation_policy" ON credit_transactions FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON credit_transactions;
CREATE POLICY "update_tenant_id_isolation_policy" ON credit_transactions FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON credit_transactions;
CREATE POLICY "delete_tenant_id_isolation_policy" ON credit_transactions FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON tenant_subscriptions;
CREATE POLICY "select_tenant_id_isolation_policy" ON tenant_subscriptions FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON tenant_subscriptions;
CREATE POLICY "insert_tenant_id_isolation_policy" ON tenant_subscriptions FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON tenant_subscriptions;
CREATE POLICY "update_tenant_id_isolation_policy" ON tenant_subscriptions FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON tenant_subscriptions;
CREATE POLICY "delete_tenant_id_isolation_policy" ON tenant_subscriptions FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON brands;
CREATE POLICY "select_organization_id_isolation_policy" ON brands FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON brands;
CREATE POLICY "insert_organization_id_isolation_policy" ON brands FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON brands;
CREATE POLICY "update_organization_id_isolation_policy" ON brands FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON brands;
CREATE POLICY "delete_organization_id_isolation_policy" ON brands FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON entities;
CREATE POLICY "select_organization_id_isolation_policy" ON entities FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON entities;
CREATE POLICY "insert_organization_id_isolation_policy" ON entities FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON entities;
CREATE POLICY "update_organization_id_isolation_policy" ON entities FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON entities;
CREATE POLICY "delete_organization_id_isolation_policy" ON entities FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON entity_relationships;
CREATE POLICY "select_organization_id_isolation_policy" ON entity_relationships FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON entity_relationships;
CREATE POLICY "insert_organization_id_isolation_policy" ON entity_relationships FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON entity_relationships;
CREATE POLICY "update_organization_id_isolation_policy" ON entity_relationships FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON entity_relationships;
CREATE POLICY "delete_organization_id_isolation_policy" ON entity_relationships FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON websites;
CREATE POLICY "select_organization_id_isolation_policy" ON websites FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON websites;
CREATE POLICY "insert_organization_id_isolation_policy" ON websites FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON websites;
CREATE POLICY "update_organization_id_isolation_policy" ON websites FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON websites;
CREATE POLICY "delete_organization_id_isolation_policy" ON websites FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON pages;
CREATE POLICY "select_organization_id_isolation_policy" ON pages FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON pages;
CREATE POLICY "insert_organization_id_isolation_policy" ON pages FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON pages;
CREATE POLICY "update_organization_id_isolation_policy" ON pages FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON pages;
CREATE POLICY "delete_organization_id_isolation_policy" ON pages FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON keywords;
CREATE POLICY "select_organization_id_isolation_policy" ON keywords FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON keywords;
CREATE POLICY "insert_organization_id_isolation_policy" ON keywords FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON keywords;
CREATE POLICY "update_organization_id_isolation_policy" ON keywords FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON keywords;
CREATE POLICY "delete_organization_id_isolation_policy" ON keywords FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON topics;
CREATE POLICY "select_organization_id_isolation_policy" ON topics FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON topics;
CREATE POLICY "insert_organization_id_isolation_policy" ON topics FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON topics;
CREATE POLICY "update_organization_id_isolation_policy" ON topics FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON topics;
CREATE POLICY "delete_organization_id_isolation_policy" ON topics FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON competitors;
CREATE POLICY "select_organization_id_isolation_policy" ON competitors FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON competitors;
CREATE POLICY "insert_organization_id_isolation_policy" ON competitors FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON competitors;
CREATE POLICY "update_organization_id_isolation_policy" ON competitors FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON competitors;
CREATE POLICY "delete_organization_id_isolation_policy" ON competitors FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE historical_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_metrics FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON historical_metrics;
CREATE POLICY "select_organization_id_isolation_policy" ON historical_metrics FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON historical_metrics;
CREATE POLICY "insert_organization_id_isolation_policy" ON historical_metrics FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON historical_metrics;
CREATE POLICY "update_organization_id_isolation_policy" ON historical_metrics FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON historical_metrics;
CREATE POLICY "delete_organization_id_isolation_policy" ON historical_metrics FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE pages_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_keywords FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON pages_keywords;
CREATE POLICY "select_organization_id_isolation_policy" ON pages_keywords FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON pages_keywords;
CREATE POLICY "insert_organization_id_isolation_policy" ON pages_keywords FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON pages_keywords;
CREATE POLICY "update_organization_id_isolation_policy" ON pages_keywords FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON pages_keywords;
CREATE POLICY "delete_organization_id_isolation_policy" ON pages_keywords FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE pages_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_topics FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON pages_topics;
CREATE POLICY "select_organization_id_isolation_policy" ON pages_topics FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON pages_topics;
CREATE POLICY "insert_organization_id_isolation_policy" ON pages_topics FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON pages_topics;
CREATE POLICY "update_organization_id_isolation_policy" ON pages_topics FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON pages_topics;
CREATE POLICY "delete_organization_id_isolation_policy" ON pages_topics FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE pages_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_entities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON pages_entities;
CREATE POLICY "select_organization_id_isolation_policy" ON pages_entities FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON pages_entities;
CREATE POLICY "insert_organization_id_isolation_policy" ON pages_entities FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON pages_entities;
CREATE POLICY "update_organization_id_isolation_policy" ON pages_entities FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON pages_entities;
CREATE POLICY "delete_organization_id_isolation_policy" ON pages_entities FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE keywords_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords_topics FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON keywords_topics;
CREATE POLICY "select_organization_id_isolation_policy" ON keywords_topics FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON keywords_topics;
CREATE POLICY "insert_organization_id_isolation_policy" ON keywords_topics FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON keywords_topics;
CREATE POLICY "update_organization_id_isolation_policy" ON keywords_topics FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON keywords_topics;
CREATE POLICY "delete_organization_id_isolation_policy" ON keywords_topics FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE topics_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics_entities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON topics_entities;
CREATE POLICY "select_organization_id_isolation_policy" ON topics_entities FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON topics_entities;
CREATE POLICY "insert_organization_id_isolation_policy" ON topics_entities FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON topics_entities;
CREATE POLICY "update_organization_id_isolation_policy" ON topics_entities FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON topics_entities;
CREATE POLICY "delete_organization_id_isolation_policy" ON topics_entities FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE diagnostic_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_findings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON diagnostic_findings;
CREATE POLICY "select_organization_id_isolation_policy" ON diagnostic_findings FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON diagnostic_findings;
CREATE POLICY "insert_organization_id_isolation_policy" ON diagnostic_findings FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON diagnostic_findings;
CREATE POLICY "update_organization_id_isolation_policy" ON diagnostic_findings FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON diagnostic_findings;
CREATE POLICY "delete_organization_id_isolation_policy" ON diagnostic_findings FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE diagnostic_finding_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_finding_relationships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON diagnostic_finding_relationships;
CREATE POLICY "select_organization_id_isolation_policy" ON diagnostic_finding_relationships FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON diagnostic_finding_relationships;
CREATE POLICY "insert_organization_id_isolation_policy" ON diagnostic_finding_relationships FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON diagnostic_finding_relationships;
CREATE POLICY "update_organization_id_isolation_policy" ON diagnostic_finding_relationships FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON diagnostic_finding_relationships;
CREATE POLICY "delete_organization_id_isolation_policy" ON diagnostic_finding_relationships FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON prompts;
CREATE POLICY "select_organization_id_isolation_policy" ON prompts FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON prompts;
CREATE POLICY "insert_organization_id_isolation_policy" ON prompts FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON prompts;
CREATE POLICY "update_organization_id_isolation_policy" ON prompts FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON prompts;
CREATE POLICY "delete_organization_id_isolation_policy" ON prompts FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_definitions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON prompt_definitions;
CREATE POLICY "select_organization_id_isolation_policy" ON prompt_definitions FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON prompt_definitions;
CREATE POLICY "insert_organization_id_isolation_policy" ON prompt_definitions FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON prompt_definitions;
CREATE POLICY "update_organization_id_isolation_policy" ON prompt_definitions FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON prompt_definitions;
CREATE POLICY "delete_organization_id_isolation_policy" ON prompt_definitions FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE prompt_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_schedules FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON prompt_schedules;
CREATE POLICY "select_organization_id_isolation_policy" ON prompt_schedules FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON prompt_schedules;
CREATE POLICY "insert_organization_id_isolation_policy" ON prompt_schedules FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON prompt_schedules;
CREATE POLICY "update_organization_id_isolation_policy" ON prompt_schedules FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON prompt_schedules;
CREATE POLICY "delete_organization_id_isolation_policy" ON prompt_schedules FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON prompt_executions;
CREATE POLICY "select_organization_id_isolation_policy" ON prompt_executions FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON prompt_executions;
CREATE POLICY "insert_organization_id_isolation_policy" ON prompt_executions FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON prompt_executions;
CREATE POLICY "update_organization_id_isolation_policy" ON prompt_executions FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON prompt_executions;
CREATE POLICY "delete_organization_id_isolation_policy" ON prompt_executions FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE position_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_observations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON position_observations;
CREATE POLICY "select_organization_id_isolation_policy" ON position_observations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON position_observations;
CREATE POLICY "insert_organization_id_isolation_policy" ON position_observations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON position_observations;
CREATE POLICY "update_organization_id_isolation_policy" ON position_observations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON position_observations;
CREATE POLICY "delete_organization_id_isolation_policy" ON position_observations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE ai_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_observations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON ai_observations;
CREATE POLICY "select_organization_id_isolation_policy" ON ai_observations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON ai_observations;
CREATE POLICY "insert_organization_id_isolation_policy" ON ai_observations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON ai_observations;
CREATE POLICY "update_organization_id_isolation_policy" ON ai_observations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON ai_observations;
CREATE POLICY "delete_organization_id_isolation_policy" ON ai_observations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE competitor_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_mentions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON competitor_mentions;
CREATE POLICY "select_organization_id_isolation_policy" ON competitor_mentions FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON competitor_mentions;
CREATE POLICY "insert_organization_id_isolation_policy" ON competitor_mentions FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON competitor_mentions;
CREATE POLICY "update_organization_id_isolation_policy" ON competitor_mentions FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON competitor_mentions;
CREATE POLICY "delete_organization_id_isolation_policy" ON competitor_mentions FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_mentions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON brand_mentions;
CREATE POLICY "select_organization_id_isolation_policy" ON brand_mentions FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON brand_mentions;
CREATE POLICY "insert_organization_id_isolation_policy" ON brand_mentions FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON brand_mentions;
CREATE POLICY "update_organization_id_isolation_policy" ON brand_mentions FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON brand_mentions;
CREATE POLICY "delete_organization_id_isolation_policy" ON brand_mentions FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON citations;
CREATE POLICY "select_organization_id_isolation_policy" ON citations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON citations;
CREATE POLICY "insert_organization_id_isolation_policy" ON citations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON citations;
CREATE POLICY "update_organization_id_isolation_policy" ON citations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON citations;
CREATE POLICY "delete_organization_id_isolation_policy" ON citations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE citation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_sources FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON citation_sources;
CREATE POLICY "select_organization_id_isolation_policy" ON citation_sources FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON citation_sources;
CREATE POLICY "insert_organization_id_isolation_policy" ON citation_sources FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON citation_sources;
CREATE POLICY "update_organization_id_isolation_policy" ON citation_sources FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON citation_sources;
CREATE POLICY "delete_organization_id_isolation_policy" ON citation_sources FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE citation_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_occurrences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON citation_occurrences;
CREATE POLICY "select_organization_id_isolation_policy" ON citation_occurrences FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON citation_occurrences;
CREATE POLICY "insert_organization_id_isolation_policy" ON citation_occurrences FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON citation_occurrences;
CREATE POLICY "update_organization_id_isolation_policy" ON citation_occurrences FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON citation_occurrences;
CREATE POLICY "delete_organization_id_isolation_policy" ON citation_occurrences FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE visibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_scores FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON visibility_scores;
CREATE POLICY "select_organization_id_isolation_policy" ON visibility_scores FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON visibility_scores;
CREATE POLICY "insert_organization_id_isolation_policy" ON visibility_scores FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON visibility_scores;
CREATE POLICY "update_organization_id_isolation_policy" ON visibility_scores FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON visibility_scores;
CREATE POLICY "delete_organization_id_isolation_policy" ON visibility_scores FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON recommendations;
CREATE POLICY "select_organization_id_isolation_policy" ON recommendations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON recommendations;
CREATE POLICY "insert_organization_id_isolation_policy" ON recommendations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON recommendations;
CREATE POLICY "update_organization_id_isolation_policy" ON recommendations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON recommendations;
CREATE POLICY "delete_organization_id_isolation_policy" ON recommendations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE brand_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_associations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON brand_associations;
CREATE POLICY "select_organization_id_isolation_policy" ON brand_associations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON brand_associations;
CREATE POLICY "insert_organization_id_isolation_policy" ON brand_associations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON brand_associations;
CREATE POLICY "update_organization_id_isolation_policy" ON brand_associations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON brand_associations;
CREATE POLICY "delete_organization_id_isolation_policy" ON brand_associations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE recommendation_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_observations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON recommendation_observations;
CREATE POLICY "select_organization_id_isolation_policy" ON recommendation_observations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON recommendation_observations;
CREATE POLICY "insert_organization_id_isolation_policy" ON recommendation_observations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON recommendation_observations;
CREATE POLICY "update_organization_id_isolation_policy" ON recommendation_observations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON recommendation_observations;
CREATE POLICY "delete_organization_id_isolation_policy" ON recommendation_observations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE ai_visibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_audits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON ai_visibility_audits;
CREATE POLICY "select_organization_id_isolation_policy" ON ai_visibility_audits FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON ai_visibility_audits;
CREATE POLICY "insert_organization_id_isolation_policy" ON ai_visibility_audits FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON ai_visibility_audits;
CREATE POLICY "update_organization_id_isolation_policy" ON ai_visibility_audits FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON ai_visibility_audits;
CREATE POLICY "delete_organization_id_isolation_policy" ON ai_visibility_audits FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE audit_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_prompts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON audit_prompts;
CREATE POLICY "select_organization_id_isolation_policy" ON audit_prompts FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON audit_prompts;
CREATE POLICY "insert_organization_id_isolation_policy" ON audit_prompts FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON audit_prompts;
CREATE POLICY "update_organization_id_isolation_policy" ON audit_prompts FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON audit_prompts;
CREATE POLICY "delete_organization_id_isolation_policy" ON audit_prompts FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE premium_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_audits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON premium_audits;
CREATE POLICY "select_organization_id_isolation_policy" ON premium_audits FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON premium_audits;
CREATE POLICY "insert_organization_id_isolation_policy" ON premium_audits FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON premium_audits;
CREATE POLICY "update_organization_id_isolation_policy" ON premium_audits FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON premium_audits;
CREATE POLICY "delete_organization_id_isolation_policy" ON premium_audits FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE technical_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_audits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON technical_audits;
CREATE POLICY "select_organization_id_isolation_policy" ON technical_audits FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON technical_audits;
CREATE POLICY "insert_organization_id_isolation_policy" ON technical_audits FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON technical_audits;
CREATE POLICY "update_organization_id_isolation_policy" ON technical_audits FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON technical_audits;
CREATE POLICY "delete_organization_id_isolation_policy" ON technical_audits FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE competitive_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_analyses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON competitive_analyses;
CREATE POLICY "select_organization_id_isolation_policy" ON competitive_analyses FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON competitive_analyses;
CREATE POLICY "insert_organization_id_isolation_policy" ON competitive_analyses FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON competitive_analyses;
CREATE POLICY "update_organization_id_isolation_policy" ON competitive_analyses FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON competitive_analyses;
CREATE POLICY "delete_organization_id_isolation_policy" ON competitive_analyses FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE aeo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_analyses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON aeo_analyses;
CREATE POLICY "select_tenant_id_isolation_policy" ON aeo_analyses FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON aeo_analyses;
CREATE POLICY "insert_tenant_id_isolation_policy" ON aeo_analyses FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON aeo_analyses;
CREATE POLICY "update_tenant_id_isolation_policy" ON aeo_analyses FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON aeo_analyses;
CREATE POLICY "delete_tenant_id_isolation_policy" ON aeo_analyses FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE faq_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_opportunities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON faq_opportunities;
CREATE POLICY "select_tenant_id_isolation_policy" ON faq_opportunities FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON faq_opportunities;
CREATE POLICY "insert_tenant_id_isolation_policy" ON faq_opportunities FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON faq_opportunities;
CREATE POLICY "update_tenant_id_isolation_policy" ON faq_opportunities FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON faq_opportunities;
CREATE POLICY "delete_tenant_id_isolation_policy" ON faq_opportunities FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE kg_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_alignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON kg_alignments;
CREATE POLICY "select_tenant_id_isolation_policy" ON kg_alignments FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON kg_alignments;
CREATE POLICY "insert_tenant_id_isolation_policy" ON kg_alignments FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON kg_alignments;
CREATE POLICY "update_tenant_id_isolation_policy" ON kg_alignments FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON kg_alignments;
CREATE POLICY "delete_tenant_id_isolation_policy" ON kg_alignments FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE automated_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_recommendations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON automated_recommendations;
CREATE POLICY "select_organization_id_isolation_policy" ON automated_recommendations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON automated_recommendations;
CREATE POLICY "insert_organization_id_isolation_policy" ON automated_recommendations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON automated_recommendations;
CREATE POLICY "update_organization_id_isolation_policy" ON automated_recommendations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON automated_recommendations;
CREATE POLICY "delete_organization_id_isolation_policy" ON automated_recommendations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE competitor_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_changes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON competitor_changes;
CREATE POLICY "select_tenant_id_isolation_policy" ON competitor_changes FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON competitor_changes;
CREATE POLICY "insert_tenant_id_isolation_policy" ON competitor_changes FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON competitor_changes;
CREATE POLICY "update_tenant_id_isolation_policy" ON competitor_changes FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON competitor_changes;
CREATE POLICY "delete_tenant_id_isolation_policy" ON competitor_changes FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE competitive_seo_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_seo_findings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON competitive_seo_findings;
CREATE POLICY "select_tenant_id_isolation_policy" ON competitive_seo_findings FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON competitive_seo_findings;
CREATE POLICY "insert_tenant_id_isolation_policy" ON competitive_seo_findings FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON competitive_seo_findings;
CREATE POLICY "update_tenant_id_isolation_policy" ON competitive_seo_findings FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON competitive_seo_findings;
CREATE POLICY "delete_tenant_id_isolation_policy" ON competitive_seo_findings FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON document_embeddings;
CREATE POLICY "select_tenant_id_isolation_policy" ON document_embeddings FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON document_embeddings;
CREATE POLICY "insert_tenant_id_isolation_policy" ON document_embeddings FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON document_embeddings;
CREATE POLICY "update_tenant_id_isolation_policy" ON document_embeddings FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON document_embeddings;
CREATE POLICY "delete_tenant_id_isolation_policy" ON document_embeddings FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE kg_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_entities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON kg_entities;
CREATE POLICY "select_tenant_id_isolation_policy" ON kg_entities FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON kg_entities;
CREATE POLICY "insert_tenant_id_isolation_policy" ON kg_entities FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON kg_entities;
CREATE POLICY "update_tenant_id_isolation_policy" ON kg_entities FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON kg_entities;
CREATE POLICY "delete_tenant_id_isolation_policy" ON kg_entities FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE kg_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_relationships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON kg_relationships;
CREATE POLICY "select_tenant_id_isolation_policy" ON kg_relationships FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON kg_relationships;
CREATE POLICY "insert_tenant_id_isolation_policy" ON kg_relationships FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON kg_relationships;
CREATE POLICY "update_tenant_id_isolation_policy" ON kg_relationships FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON kg_relationships;
CREATE POLICY "delete_tenant_id_isolation_policy" ON kg_relationships FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON crawl_jobs;
CREATE POLICY "select_tenant_id_isolation_policy" ON crawl_jobs FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON crawl_jobs;
CREATE POLICY "insert_tenant_id_isolation_policy" ON crawl_jobs FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON crawl_jobs;
CREATE POLICY "update_tenant_id_isolation_policy" ON crawl_jobs FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON crawl_jobs;
CREATE POLICY "delete_tenant_id_isolation_policy" ON crawl_jobs FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_results FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON crawl_results;
CREATE POLICY "select_tenant_id_isolation_policy" ON crawl_results FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON crawl_results;
CREATE POLICY "insert_tenant_id_isolation_policy" ON crawl_results FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON crawl_results;
CREATE POLICY "update_tenant_id_isolation_policy" ON crawl_results FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON crawl_results;
CREATE POLICY "delete_tenant_id_isolation_policy" ON crawl_results FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE crawl_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_cache FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tenant_id_isolation_policy" ON crawl_cache;
CREATE POLICY "select_tenant_id_isolation_policy" ON crawl_cache FOR SELECT USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_tenant_id_isolation_policy" ON crawl_cache;
CREATE POLICY "insert_tenant_id_isolation_policy" ON crawl_cache FOR INSERT WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_tenant_id_isolation_policy" ON crawl_cache;
CREATE POLICY "update_tenant_id_isolation_policy" ON crawl_cache FOR UPDATE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_tenant_id_isolation_policy" ON crawl_cache;
CREATE POLICY "delete_tenant_id_isolation_policy" ON crawl_cache FOR DELETE USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_configs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON monitoring_configs;
CREATE POLICY "select_organization_id_isolation_policy" ON monitoring_configs FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON monitoring_configs;
CREATE POLICY "insert_organization_id_isolation_policy" ON monitoring_configs FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON monitoring_configs;
CREATE POLICY "update_organization_id_isolation_policy" ON monitoring_configs FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON monitoring_configs;
CREATE POLICY "delete_organization_id_isolation_policy" ON monitoring_configs FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE crawl_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_snapshots FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON crawl_snapshots;
CREATE POLICY "select_organization_id_isolation_policy" ON crawl_snapshots FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON crawl_snapshots;
CREATE POLICY "insert_organization_id_isolation_policy" ON crawl_snapshots FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON crawl_snapshots;
CREATE POLICY "update_organization_id_isolation_policy" ON crawl_snapshots FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON crawl_snapshots;
CREATE POLICY "delete_organization_id_isolation_policy" ON crawl_snapshots FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON monitoring_alerts;
CREATE POLICY "select_organization_id_isolation_policy" ON monitoring_alerts FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON monitoring_alerts;
CREATE POLICY "insert_organization_id_isolation_policy" ON monitoring_alerts FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON monitoring_alerts;
CREATE POLICY "update_organization_id_isolation_policy" ON monitoring_alerts FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON monitoring_alerts;
CREATE POLICY "delete_organization_id_isolation_policy" ON monitoring_alerts FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_org_isolation_policy" ON organizations;
CREATE POLICY "select_org_isolation_policy" ON organizations FOR SELECT USING ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_org_isolation_policy" ON organizations;
CREATE POLICY "insert_org_isolation_policy" ON organizations FOR INSERT WITH CHECK ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_org_isolation_policy" ON organizations;
CREATE POLICY "update_org_isolation_policy" ON organizations FOR UPDATE USING ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_org_isolation_policy" ON organizations;
CREATE POLICY "delete_org_isolation_policy" ON organizations FOR DELETE USING ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON organization_members;
CREATE POLICY "select_organization_id_isolation_policy" ON organization_members FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON organization_members;
CREATE POLICY "insert_organization_id_isolation_policy" ON organization_members FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON organization_members;
CREATE POLICY "update_organization_id_isolation_policy" ON organization_members FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON organization_members;
CREATE POLICY "delete_organization_id_isolation_policy" ON organization_members FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON organization_invitations;
CREATE POLICY "select_organization_id_isolation_policy" ON organization_invitations FOR SELECT USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON organization_invitations;
CREATE POLICY "insert_organization_id_isolation_policy" ON organization_invitations FOR INSERT WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON organization_invitations;
CREATE POLICY "update_organization_id_isolation_policy" ON organization_invitations FOR UPDATE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON organization_invitations;
CREATE POLICY "delete_organization_id_isolation_policy" ON organization_invitations FOR DELETE USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
