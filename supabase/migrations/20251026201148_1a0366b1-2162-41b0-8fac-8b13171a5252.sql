-- Clean all existing template data of null characters and control chars
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = SUBSTRING(regexp_replace(COALESCE(stage_name, 'Stage'), '[\x00-\x1F\x7F]+', '', 'g') FOR 200),
  stage_description = SUBSTRING(regexp_replace(COALESCE(stage_description, ''), '[\x00-\x1F\x7F]+', '', 'g') FOR 2000),
  stage_type = SUBSTRING(regexp_replace(COALESCE(stage_type, 'assessment'), '[\x00-\x1F\x7F]+', '', 'g') FOR 50);

-- Clean milestone template names and descriptions
UPDATE public.compliance_roadmap_milestone_templates
SET 
  milestone_name = SUBSTRING(regexp_replace(COALESCE(milestone_name, 'Milestone'), '[\x00-\x1F\x7F]+', '', 'g') FOR 200),
  milestone_description = SUBSTRING(regexp_replace(COALESCE(milestone_description, ''), '[\x00-\x1F\x7F]+', '', 'g') FOR 2000);

-- Clean required_actions arrays
UPDATE public.compliance_roadmap_milestone_templates
SET required_actions = (
  SELECT ARRAY(
    SELECT SUBSTRING(regexp_replace(x, '[\x00-\x1F\x7F]+', '', 'g') FOR 200)
    FROM unnest(required_actions) AS x
  )
)
WHERE required_actions IS NOT NULL;

-- Clean success_criteria arrays
UPDATE public.compliance_roadmap_milestone_templates
SET success_criteria = (
  SELECT ARRAY(
    SELECT SUBSTRING(regexp_replace(x, '[\x00-\x1F\x7F]+', '', 'g') FOR 200)
    FROM unnest(success_criteria) AS x
  )
)
WHERE success_criteria IS NOT NULL;