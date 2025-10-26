-- Clean compliance_frameworks table
UPDATE public.compliance_frameworks
SET 
  framework_code = regexp_replace(COALESCE(framework_code, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  framework_name = regexp_replace(COALESCE(framework_name, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  industry = regexp_replace(COALESCE(industry, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  description = regexp_replace(COALESCE(description, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  version = regexp_replace(COALESCE(version, ''), '[\x00-\x1F\x7F]+', '', 'g');

-- Clean compliance_controls table (only existing text columns)
UPDATE public.compliance_controls
SET 
  control_id = regexp_replace(COALESCE(control_id, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  control_name = regexp_replace(COALESCE(control_name, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  description = regexp_replace(COALESCE(description, ''), '[\x00-\x1F\x7F]+', '', 'g'),
  category = regexp_replace(COALESCE(category, ''), '[\x00-\x1F\x7F]+', '', 'g')
WHERE control_id IS NOT NULL OR control_name IS NOT NULL;

-- Clean compliance_roadmap_stages (user data)
UPDATE public.compliance_roadmap_stages
SET 
  stage_name = SUBSTRING(regexp_replace(COALESCE(stage_name, 'Stage'), '[\x00-\x1F\x7F]+', '', 'g') FOR 200),
  stage_description = SUBSTRING(regexp_replace(COALESCE(stage_description, ''), '[\x00-\x1F\x7F]+', '', 'g') FOR 2000),
  stage_type = SUBSTRING(regexp_replace(COALESCE(stage_type, 'assessment'), '[\x00-\x1F\x7F]+', '', 'g') FOR 50),
  status = SUBSTRING(regexp_replace(COALESCE(status, 'not_started'), '[\x00-\x1F\x7F]+', '', 'g') FOR 50)
WHERE stage_name IS NOT NULL OR stage_description IS NOT NULL;

-- Clean compliance_roadmap_milestones (user data) - assigned_to is UUID, skip it
UPDATE public.compliance_roadmap_milestones
SET 
  milestone_name = SUBSTRING(regexp_replace(COALESCE(milestone_name, 'Milestone'), '[\x00-\x1F\x7F]+', '', 'g') FOR 200),
  milestone_description = SUBSTRING(regexp_replace(COALESCE(milestone_description, ''), '[\x00-\x1F\x7F]+', '', 'g') FOR 2000),
  status = SUBSTRING(regexp_replace(COALESCE(status, 'pending'), '[\x00-\x1F\x7F]+', '', 'g') FOR 50)
WHERE milestone_name IS NOT NULL OR milestone_description IS NOT NULL;

-- Clean milestone arrays
UPDATE public.compliance_roadmap_milestones
SET required_actions = (
  SELECT ARRAY(
    SELECT SUBSTRING(regexp_replace(x, '[\x00-\x1F\x7F]+', '', 'g') FOR 200)
    FROM unnest(required_actions) AS x
  )
)
WHERE required_actions IS NOT NULL;

UPDATE public.compliance_roadmap_milestones
SET success_criteria = (
  SELECT ARRAY(
    SELECT SUBSTRING(regexp_replace(x, '[\x00-\x1F\x7F]+', '', 'g') FOR 200)
    FROM unnest(success_criteria) AS x
  )
)
WHERE success_criteria IS NOT NULL;

UPDATE public.compliance_roadmap_milestones
SET linked_control_ids = (
  SELECT ARRAY(
    SELECT SUBSTRING(regexp_replace(x, '[\x00-\x1F\x7F]+', '', 'g') FOR 200)
    FROM unnest(linked_control_ids) AS x
  )
)
WHERE linked_control_ids IS NOT NULL;