
-- Temporarily disable validation triggers on template tables to allow clean data insertion
DROP TRIGGER IF EXISTS validate_roadmap_stage_template ON compliance_roadmap_stage_templates;
DROP TRIGGER IF EXISTS validate_roadmap_milestone_template ON compliance_roadmap_milestone_templates;

-- Keep only the sanitization triggers which will clean the data
-- The sanitization triggers are: sanitize_compliance_roadmap_stage_template and sanitize_compliance_roadmap_milestone_template
