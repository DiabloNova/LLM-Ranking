CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "aeo_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"url" text NOT NULL,
	"target_keyword" text NOT NULL,
	"overall_aeo_score" integer NOT NULL,
	"answerability_score" integer NOT NULL,
	"entity_coverage_score" integer NOT NULL,
	"semantic_coverage_score" integer NOT NULL,
	"question_coverage_score" integer NOT NULL,
	"citation_readiness_score" integer NOT NULL,
	"structured_answer_quality_score" integer NOT NULL,
	"analysis_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aeo_analyses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_engines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"version" text NOT NULL,
	"capabilities" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version_num" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"engine_id" uuid NOT NULL,
	"raw_response_text" text NOT NULL,
	"parsed_sentiment" text NOT NULL,
	"position_rank" integer,
	"observed_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_provider_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"api_key_masked" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failover_provider_id" uuid,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_visibility_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"target_brand_name" text NOT NULL,
	"target_domain" text NOT NULL,
	"overall_score" integer NOT NULL,
	"brand_authority_score" integer NOT NULL,
	"ai_search_share_score" integer NOT NULL,
	"sentiment_score" integer NOT NULL,
	"citation_reliability_score" integer NOT NULL,
	"recommendation_share_score" integer NOT NULL,
	"dimensions_json" jsonb NOT NULL,
	"audited_engine_ids" text[] NOT NULL,
	"audited_prompts_count" integer NOT NULL,
	"raw_observations_count" integer NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_visibility_audits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"prompt_text" text NOT NULL,
	"category" text NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT NOW() NOT NULL,
	"actor_id" text NOT NULL,
	"actor_email" text NOT NULL,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"payload_before" text,
	"payload_after" text,
	"status" text NOT NULL,
	"error_details" text
);
--> statement-breakpoint
CREATE TABLE "brand_associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"attribute_name" text NOT NULL,
	"association_score" double precision DEFAULT 0 NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"sample_excerpts" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_associations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brand_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"mention_context" text NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"sentiment_score" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_mentions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"canonical_domain" text NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"industry" text NOT NULL,
	"target_markets" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "citation_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"engine_id" text NOT NULL,
	"prompt_text" text NOT NULL,
	"citation_position" integer DEFAULT 1 NOT NULL,
	"excerpt_text" text,
	"sentiment_score" double precision DEFAULT 0 NOT NULL,
	"is_brand_mentioned" boolean DEFAULT false NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "citation_occurrences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "citation_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"publisher_name" text,
	"publisher_category" text DEFAULT 'General' NOT NULL,
	"authority_score" integer DEFAULT 50 NOT NULL,
	"is_verified_domain" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "citation_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"anchor_text" text,
	"citation_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "citations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "competitive_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_url" text NOT NULL,
	"competitor_urls" text[] NOT NULL,
	"overall_score" integer NOT NULL,
	"market_position" text NOT NULL,
	"comparison_data" jsonb NOT NULL,
	"advantages" jsonb NOT NULL,
	"gaps" jsonb NOT NULL,
	"opportunities" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE "competitive_analyses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "competitive_seo_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"competitor_id" uuid,
	"finding_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recommendation" text NOT NULL,
	"impact_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "competitive_seo_findings_finding_type_check" CHECK (finding_type IN (
    'technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference',
    'ai_visibility_gap', 'citation_gap', 'prompt_gap', 'brand_mention_gap', 'ai_recommendation_gap', 'citation_overlap'
  ))
);
--> statement-breakpoint
ALTER TABLE "competitive_seo_findings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "competitor_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"competitor_id" uuid NOT NULL,
	"change_type" text NOT NULL,
	"severity" text NOT NULL,
	"summary" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"detected_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitor_changes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"normalized_url" text NOT NULL,
	"is_direct" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "crawl_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"cache_scope" text DEFAULT 'tenant' NOT NULL,
	"cache_key" text NOT NULL,
	"normalized_result" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "crawl_cache_scope_check" CHECK (cache_scope = 'tenant')
);
--> statement-breakpoint
ALTER TABLE "crawl_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "crawl_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"requested_url" text NOT NULL,
	"normalized_url" text NOT NULL,
	"policy" jsonb NOT NULL,
	"dedup_key" text NOT NULL,
	"cache_key" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"provider_id" text,
	"provider_job_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer NOT NULL,
	"scheduled_for" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"heartbeat_at" timestamp with time zone,
	"lease_expires_at" timestamp with time zone,
	"worker_id" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"page_count" integer,
	"bytes_processed" bigint,
	"cache_outcome" text,
	"error" jsonb,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"cancellation_requested_by" text,
	"result_ref" uuid,
	"correlation_id" text,
	"request_id" text,
	"trace_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "crawl_jobs_status_check" CHECK (status IN ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED')),
	CONSTRAINT "crawl_jobs_attempts_check" CHECK (attempts >= 0),
	CONSTRAINT "crawl_jobs_max_attempts_check" CHECK (max_attempts > 0),
	CONSTRAINT "crawl_jobs_cache_outcome_check" CHECK (cache_outcome IS NULL OR cache_outcome IN ('HIT', 'MISS', 'STALE', 'BYPASS')),
	CONSTRAINT "crawl_jobs_version_check" CHECK (version > 0)
);
--> statement-breakpoint
ALTER TABLE "crawl_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "crawl_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crawl_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "diagnostic_finding_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"parent_finding_id" uuid NOT NULL,
	"child_finding_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnostic_finding_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "diagnostic_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"finding_type" text NOT NULL,
	"severity" text NOT NULL,
	"confidence" double precision NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recommendation" text NOT NULL,
	"impact_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnostic_findings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"content_chunk" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_embeddings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"entity_type" text NOT NULL,
	"description" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entity_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "faq_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"aeo_analysis_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"user_intent" text DEFAULT 'Informational' NOT NULL,
	"opportunity_score" integer DEFAULT 50 NOT NULL,
	"suggested_answer" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faq_opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"is_enabled_globally" boolean DEFAULT false NOT NULL,
	"tenant_overrides" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "historical_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" double precision NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "historical_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"term" text NOT NULL,
	"normalized_term" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"intent" text,
	"search_volume" integer,
	"cpc" double precision,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "keywords" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "keywords_topics" (
	"keyword_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "keywords_topics_keyword_id_topic_id_pk" PRIMARY KEY("keyword_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "kg_alignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"aeo_analysis_id" uuid NOT NULL,
	"entity_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"wikidata_id" text,
	"alignment_status" text DEFAULT 'unmapped' NOT NULL,
	"confidence" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kg_alignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "kg_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kg_entities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "kg_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kg_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"website_id" uuid NOT NULL,
	"url" text NOT NULL,
	"normalized_url" text NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"meta_description" text,
	"http_status" integer DEFAULT 200 NOT NULL,
	"content_type" text,
	"content_hash" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"canonical_url" text,
	"robots_directives" text[] DEFAULT '{}'::text[] NOT NULL,
	"inlink_count" integer DEFAULT 0 NOT NULL,
	"outlink_count" integer DEFAULT 0 NOT NULL,
	"last_crawled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages_entities" (
	"page_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"salience" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "pages_entities_page_id_entity_id_pk" PRIMARY KEY("page_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "pages_keywords" (
	"page_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "pages_keywords_page_id_keyword_id_pk" PRIMARY KEY("page_id","keyword_id")
);
--> statement-breakpoint
CREATE TABLE "pages_topics" (
	"page_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"score" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "pages_topics_page_id_topic_id_pk" PRIMARY KEY("page_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_execution_id" uuid NOT NULL,
	"subject_entity_id" text NOT NULL,
	"presence" text NOT NULL,
	"numeric_position" integer,
	"evidence_excerpt" text NOT NULL,
	"evidence_structure" text NOT NULL,
	"confidence" double precision NOT NULL,
	"analyzer_version" text DEFAULT '1.0.0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "position_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "premium_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"url" text NOT NULL,
	"score" integer NOT NULL,
	"grade" text NOT NULL,
	"pages_analyzed" integer NOT NULL,
	"metrics" jsonb NOT NULL,
	"issues" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "premium_audits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompt_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"prompt_template" text NOT NULL,
	"category" text NOT NULL,
	"intent" text NOT NULL,
	"locale" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"variables" jsonb NOT NULL,
	"competitors" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"opt_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompt_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"prompt_version" integer NOT NULL,
	"resolved_prompt_text" text NOT NULL,
	"variables_values" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"model_version" text,
	"response_text" text,
	"latency_ms" integer,
	"error_message" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"scheduled_for" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "prompt_executions_status_check" CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "prompt_executions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompt_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"cron_expression" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"next_execution_at" timestamp with time zone,
	"last_execution_at" timestamp with time zone,
	"status" text DEFAULT 'IDLE' NOT NULL,
	"failure_reason" text,
	"schedule_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompt_schedules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"query_text" text NOT NULL,
	"category" text NOT NULL,
	"buying_intent" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recommendation_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"category" text NOT NULL,
	"recommended_action" text NOT NULL,
	"engine_id" text NOT NULL,
	"frequency" integer DEFAULT 1 NOT NULL,
	"confidence_score" double precision DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommendation_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"impact_score" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"action_plan" jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommendations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hierarchy_rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "system_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"category" text NOT NULL,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "system_configurations_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "technical_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"url" text NOT NULL,
	"technical_score" integer NOT NULL,
	"grade" text NOT NULL,
	"pages_analyzed" integer NOT NULL,
	"categories" jsonb NOT NULL,
	"critical_issues" jsonb NOT NULL,
	"quick_wins" jsonb NOT NULL,
	"performance_metrics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE "technical_audits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenant_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"max_users" integer NOT NULL,
	"max_brands" integer NOT NULL,
	"max_prompts" integer NOT NULL,
	"max_observations_per_month" integer NOT NULL,
	"max_crawl_jobs_per_day" integer NOT NULL,
	"monthly_token_limit" integer NOT NULL,
	"monthly_cost_limit_usd" integer NOT NULL,
	"used_observations_this_month" integer DEFAULT 0 NOT NULL,
	"used_tokens_this_month" integer DEFAULT 0 NOT NULL,
	"used_crawl_jobs_today" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_quotas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenant_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"billing_cycle" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"price_amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"language" text DEFAULT 'en' NOT NULL,
	"parent_topic_id" uuid,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topics_entities" (
	"topic_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	CONSTRAINT "topics_entities_topic_id_entity_id_pk" PRIMARY KEY("topic_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "visibility_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"engine_id" uuid NOT NULL,
	"overall_score" integer NOT NULL,
	"presence_rate" double precision NOT NULL,
	"avg_position" double precision,
	"net_sentiment" double precision NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visibility_scores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"normalized_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"cms_type" text,
	"last_crawled_at" timestamp with time zone,
	"last_analyzed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "websites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "aeo_analyses" ADD CONSTRAINT "aeo_analyses_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_engine_id_ai_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."ai_engines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility_audits" ADD CONSTRAINT "ai_visibility_audits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_prompts" ADD CONSTRAINT "audit_prompts_audit_id_ai_visibility_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."ai_visibility_audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_prompts" ADD CONSTRAINT "audit_prompts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_associations" ADD CONSTRAINT "brand_associations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_associations" ADD CONSTRAINT "brand_associations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_observation_id_ai_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."ai_observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_occurrences" ADD CONSTRAINT "citation_occurrences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_occurrences" ADD CONSTRAINT "citation_occurrences_source_id_citation_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."citation_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citation_sources" ADD CONSTRAINT "citation_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_observation_id_ai_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."ai_observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitive_seo_findings" ADD CONSTRAINT "competitive_seo_findings_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitive_seo_findings" ADD CONSTRAINT "competitive_seo_findings_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_changes" ADD CONSTRAINT "competitor_changes_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_changes" ADD CONSTRAINT "competitor_changes_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_results" ADD CONSTRAINT "crawl_results_job_id_crawl_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_finding_relationships" ADD CONSTRAINT "diagnostic_finding_relationships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_finding_relationships" ADD CONSTRAINT "diagnostic_finding_relationships_parent_finding_id_diagnostic_findings_id_fk" FOREIGN KEY ("parent_finding_id") REFERENCES "public"."diagnostic_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_finding_relationships" ADD CONSTRAINT "diagnostic_finding_relationships_child_finding_id_diagnostic_findings_id_fk" FOREIGN KEY ("child_finding_id") REFERENCES "public"."diagnostic_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_findings" ADD CONSTRAINT "diagnostic_findings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_source_entity_id_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_target_entity_id_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_opportunities" ADD CONSTRAINT "faq_opportunities_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_opportunities" ADD CONSTRAINT "faq_opportunities_aeo_analysis_id_aeo_analyses_id_fk" FOREIGN KEY ("aeo_analysis_id") REFERENCES "public"."aeo_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_metrics" ADD CONSTRAINT "historical_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords_topics" ADD CONSTRAINT "keywords_topics_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords_topics" ADD CONSTRAINT "keywords_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords_topics" ADD CONSTRAINT "keywords_topics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_alignments" ADD CONSTRAINT "kg_alignments_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_alignments" ADD CONSTRAINT "kg_alignments_aeo_analysis_id_aeo_analyses_id_fk" FOREIGN KEY ("aeo_analysis_id") REFERENCES "public"."aeo_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_source_entity_id_kg_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."kg_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_target_entity_id_kg_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."kg_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_entities" ADD CONSTRAINT "pages_entities_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_entities" ADD CONSTRAINT "pages_entities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_entities" ADD CONSTRAINT "pages_entities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_keywords" ADD CONSTRAINT "pages_keywords_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_keywords" ADD CONSTRAINT "pages_keywords_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_keywords" ADD CONSTRAINT "pages_keywords_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_topics" ADD CONSTRAINT "pages_topics_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_topics" ADD CONSTRAINT "pages_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_topics" ADD CONSTRAINT "pages_topics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_observations" ADD CONSTRAINT "position_observations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_observations" ADD CONSTRAINT "position_observations_source_execution_id_prompt_executions_id_fk" FOREIGN KEY ("source_execution_id") REFERENCES "public"."prompt_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_audits" ADD CONSTRAINT "premium_audits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_definitions" ADD CONSTRAINT "prompt_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_definitions" ADD CONSTRAINT "prompt_definitions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_executions" ADD CONSTRAINT "prompt_executions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_executions" ADD CONSTRAINT "prompt_executions_prompt_id_prompt_definitions_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompt_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_schedules" ADD CONSTRAINT "prompt_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_schedules" ADD CONSTRAINT "prompt_schedules_prompt_id_prompt_definitions_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompt_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_observations" ADD CONSTRAINT "recommendation_observations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_observations" ADD CONSTRAINT "recommendation_observations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_topic_id_topics_id_fk" FOREIGN KEY ("parent_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics_entities" ADD CONSTRAINT "topics_entities_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics_entities" ADD CONSTRAINT "topics_entities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics_entities" ADD CONSTRAINT "topics_entities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_scores" ADD CONSTRAINT "visibility_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_scores" ADD CONSTRAINT "visibility_scores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_scores" ADD CONSTRAINT "visibility_scores_engine_id_ai_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."ai_engines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_users_email" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_admin_users_deleted_at" ON "admin_users" USING btree ("deleted_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_aeo_analyses_tenant" ON "aeo_analyses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_aeo_analyses_url" ON "aeo_analyses" USING btree ("url");--> statement-breakpoint
CREATE INDEX "idx_ai_observations_organization" ON "ai_observations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_observations_prompt" ON "ai_observations" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_ai_observations_engine" ON "ai_observations" USING btree ("engine_id");--> statement-breakpoint
CREATE INDEX "idx_ai_provider_configs_active" ON "ai_provider_configs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ai_vis_audits_org" ON "ai_visibility_audits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_vis_audits_brand" ON "ai_visibility_audits" USING btree ("target_brand_name");--> statement-breakpoint
CREATE INDEX "idx_ai_vis_audits_status" ON "ai_visibility_audits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_prompts_audit" ON "audit_prompts" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "idx_audit_prompts_org" ON "audit_prompts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_audit_records_actor" ON "audit_records" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_records_resource" ON "audit_records" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_records_timestamp" ON "audit_records" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_brand_associations_tenant" ON "brand_associations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_brand_associations_brand" ON "brand_associations" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_brand_mentions_organization" ON "brand_mentions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_brand_mentions_brand" ON "brand_mentions" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_brands_organization" ON "brands" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_brands_domain" ON "brands" USING btree ("canonical_domain");--> statement-breakpoint
CREATE INDEX "idx_citation_occurrences_tenant" ON "citation_occurrences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_citation_occurrences_source" ON "citation_occurrences" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_citation_sources_tenant" ON "citation_sources" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_citation_sources_url_org" ON "citation_sources" USING btree ("organization_id","url");--> statement-breakpoint
CREATE INDEX "idx_citations_organization" ON "citations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_citations_observation" ON "citations" USING btree ("observation_id");--> statement-breakpoint
CREATE INDEX "idx_citations_domain" ON "citations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_comp_seo_findings_tenant" ON "competitive_seo_findings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_comp_seo_findings_comp" ON "competitive_seo_findings" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "idx_comp_seo_findings_type" ON "competitive_seo_findings" USING btree ("finding_type");--> statement-breakpoint
CREATE INDEX "idx_competitor_changes_tenant" ON "competitor_changes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_competitor_changes_comp" ON "competitor_changes" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "idx_competitor_changes_type" ON "competitor_changes" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "idx_competitors_organization" ON "competitors" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_competitors_domain_org" ON "competitors" USING btree ("organization_id","domain") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_crawl_cache_key" ON "crawl_cache" USING btree ("tenant_id","cache_scope","cache_key");--> statement-breakpoint
CREATE INDEX "idx_crawl_jobs_tenant_status" ON "crawl_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_crawl_jobs_status_scheduled" ON "crawl_jobs" USING btree ("status","scheduled_for") WHERE status = 'QUEUED';--> statement-breakpoint
CREATE INDEX "idx_crawl_jobs_provider_job_id" ON "crawl_jobs" USING btree ("provider_job_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_jobs_tenant_created" ON "crawl_jobs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_crawl_jobs_active_dedup" ON "crawl_jobs" USING btree ("tenant_id","dedup_key") WHERE status IN ('PENDING', 'QUEUED', 'RUNNING');--> statement-breakpoint
CREATE UNIQUE INDEX "crawl_results_job_unique" ON "crawl_results" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crawl_results_tenant_job_unique" ON "crawl_results" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_rel_org" ON "diagnostic_finding_relationships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_rel_parent" ON "diagnostic_finding_relationships" USING btree ("parent_finding_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_rel_child" ON "diagnostic_finding_relationships" USING btree ("child_finding_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_findings_org" ON "diagnostic_findings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_findings_domain" ON "diagnostic_findings" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_findings_status" ON "diagnostic_findings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_document_embeddings_tenant" ON "document_embeddings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_entities_organization" ON "entities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_entities_type" ON "entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_entity_relationships_org" ON "entity_relationships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_entity_relationships_source" ON "entity_relationships" USING btree ("source_entity_id");--> statement-breakpoint
CREATE INDEX "idx_entity_relationships_target" ON "entity_relationships" USING btree ("target_entity_id");--> statement-breakpoint
CREATE INDEX "idx_faq_opps_tenant" ON "faq_opportunities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_faq_opps_analysis" ON "faq_opportunities" USING btree ("aeo_analysis_id");--> statement-breakpoint
CREATE INDEX "idx_feature_flags_key" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_historical_metrics_lookup" ON "historical_metrics" USING btree ("organization_id","entity_type","entity_id","metric_name");--> statement-breakpoint
CREATE INDEX "idx_historical_metrics_time" ON "historical_metrics" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_keywords_organization" ON "keywords" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_keywords_term_org" ON "keywords" USING btree ("organization_id","normalized_term") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_keywords_topics_org" ON "keywords_topics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_kg_alignments_tenant" ON "kg_alignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_kg_alignments_analysis" ON "kg_alignments" USING btree ("aeo_analysis_id");--> statement-breakpoint
CREATE INDEX "idx_kg_entities_tenant" ON "kg_entities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_kg_entities_name" ON "kg_entities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_kg_relationships_tenant" ON "kg_relationships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_kg_relationships_source" ON "kg_relationships" USING btree ("source_entity_id");--> statement-breakpoint
CREATE INDEX "idx_kg_relationships_target" ON "kg_relationships" USING btree ("target_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_organizations_slug" ON "organizations" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_organization" ON "pages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pages_website" ON "pages" USING btree ("website_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pages_url_org" ON "pages" USING btree ("organization_id","normalized_url") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_entities_org" ON "pages_entities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pages_keywords_org" ON "pages_keywords" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pages_topics_org" ON "pages_topics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_permissions_role_id" ON "permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_position_obs_tenant" ON "position_observations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_premium_audits_organization" ON "premium_audits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_definitions_tenant" ON "prompt_definitions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_executions_tenant" ON "prompt_executions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_executions_status" ON "prompt_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prompt_schedules_tenant" ON "prompt_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_organization" ON "prompts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_brand" ON "prompts" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_recommendation_obs_tenant" ON "recommendation_observations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_recommendation_obs_brand" ON "recommendation_observations" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_organization" ON "recommendations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_brand" ON "recommendations" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_roles_name" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_system_configurations_key" ON "system_configurations" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_tenant_quotas_tenant" ON "tenant_quotas" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_subscriptions_tenant" ON "tenant_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_topics_organization" ON "topics" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_topics_name_org" ON "topics" USING btree ("organization_id","name") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_topics_entities_org" ON "topics_entities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_visibility_scores_organization" ON "visibility_scores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_visibility_scores_brand" ON "visibility_scores" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_websites_organization" ON "websites" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_websites_domain_org" ON "websites" USING btree ("organization_id","domain") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "aeo_analyses" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "aeo_analyses" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "aeo_analyses" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "aeo_analyses" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "ai_observations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "ai_observations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "ai_observations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "ai_observations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "ai_visibility_audits" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "ai_visibility_audits" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "ai_visibility_audits" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "ai_visibility_audits" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "audit_prompts" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "audit_prompts" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "audit_prompts" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "audit_prompts" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "brand_associations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "brand_associations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "brand_associations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "brand_associations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "brand_mentions" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "brand_mentions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "brand_mentions" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "brand_mentions" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "brands" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "brands" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "brands" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "brands" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "citation_occurrences" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "citation_occurrences" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "citation_occurrences" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "citation_occurrences" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "citation_sources" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "citation_sources" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "citation_sources" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "citation_sources" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "citations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "citations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "citations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "citations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "competitive_analyses" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "competitive_analyses" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "competitive_analyses" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "competitive_analyses" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "competitive_seo_findings" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "competitive_seo_findings" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "competitive_seo_findings" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "competitive_seo_findings" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "competitor_changes" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "competitor_changes" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "competitor_changes" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "competitor_changes" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "competitors" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "competitors" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "competitors" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "competitors" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "crawl_tenant_policy" ON "crawl_cache" AS PERMISSIVE FOR ALL TO public USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));--> statement-breakpoint
CREATE POLICY "crawl_tenant_policy" ON "crawl_jobs" AS PERMISSIVE FOR ALL TO public USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));--> statement-breakpoint
CREATE POLICY "crawl_tenant_policy" ON "crawl_results" AS PERMISSIVE FOR ALL TO public USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "diagnostic_finding_relationships" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "diagnostic_finding_relationships" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "diagnostic_finding_relationships" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "diagnostic_finding_relationships" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "diagnostic_findings" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "diagnostic_findings" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "diagnostic_findings" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "diagnostic_findings" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "document_embeddings" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "document_embeddings" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "document_embeddings" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "document_embeddings" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "entities" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "entities" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "entities" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "entities" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "entity_relationships" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "entity_relationships" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "entity_relationships" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "entity_relationships" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "faq_opportunities" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "faq_opportunities" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "faq_opportunities" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "faq_opportunities" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "historical_metrics" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "historical_metrics" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "historical_metrics" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "historical_metrics" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "keywords" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "keywords" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "keywords" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "keywords" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "kg_alignments" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "kg_alignments" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "kg_alignments" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "kg_alignments" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "kg_entities" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "kg_entities" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "kg_entities" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "kg_entities" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "kg_relationships" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "kg_relationships" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "kg_relationships" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "kg_relationships" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_org_isolation_policy" ON "organizations" AS PERMISSIVE FOR SELECT TO public USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_org_isolation_policy" ON "organizations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_org_isolation_policy" ON "organizations" AS PERMISSIVE FOR UPDATE TO public USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_org_isolation_policy" ON "organizations" AS PERMISSIVE FOR DELETE TO public USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "pages" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "pages" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "pages" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "pages" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "position_observations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "position_observations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "position_observations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "position_observations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "premium_audits" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "premium_audits" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "premium_audits" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "premium_audits" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "prompt_definitions" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "prompt_definitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "prompt_definitions" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "prompt_definitions" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "prompt_executions" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "prompt_executions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "prompt_executions" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "prompt_executions" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "prompt_schedules" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "prompt_schedules" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "prompt_schedules" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "prompt_schedules" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "prompts" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "prompts" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "prompts" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "prompts" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "recommendation_observations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "recommendation_observations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "recommendation_observations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "recommendation_observations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "recommendations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "recommendations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "recommendations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "recommendations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "technical_audits" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "technical_audits" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "technical_audits" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "technical_audits" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "tenant_quotas" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "tenant_quotas" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "tenant_quotas" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "tenant_quotas" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "tenant_subscriptions" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "tenant_subscriptions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "tenant_subscriptions" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "tenant_subscriptions" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "topics" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "topics" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "topics" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "topics" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "visibility_scores" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "visibility_scores" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "visibility_scores" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "visibility_scores" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "websites" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "websites" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "websites" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "websites" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);