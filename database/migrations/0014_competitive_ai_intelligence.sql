-- Migration: Incremental extension of competitive_seo_findings types to support AI intelligence gaps
-- Alters finding_type CHECK constraints without breaking existing data

ALTER TABLE competitive_seo_findings DROP CONSTRAINT IF EXISTS competitive_seo_findings_finding_type_check;
ALTER TABLE competitive_seo_findings ADD CONSTRAINT competitive_seo_findings_finding_type_check
  CHECK (finding_type IN (
    'technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference',
    'ai_visibility_gap', 'citation_gap', 'prompt_gap', 'brand_mention_gap', 'ai_recommendation_gap', 'citation_overlap'
  ));
