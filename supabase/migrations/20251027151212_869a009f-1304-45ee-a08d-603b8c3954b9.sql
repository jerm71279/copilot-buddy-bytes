-- Clean existing template data to remove null bytes
-- Update ALL rows unconditionally since WHERE clause with regex causes encoding errors

-- Step 1: Clean ALL stage templates
UPDATE public.compliance_roadmap_stage_templates
SET 
  stage_name = strip_control_chars(stage_name),
  stage_description = CASE 
    WHEN stage_description IS NULL THEN NULL 
    ELSE strip_control_chars(stage_description) 
  END,
  stage_type = strip_control_chars(COALESCE(stage_type, 'assessment'));

-- Step 2: Clean ALL milestone templates (text fields and arrays)
UPDATE public.compliance_roadmap_milestone_templates
SET 
  milestone_name = strip_control_chars(milestone_name),
  milestone_description = CASE 
    WHEN milestone_description IS NULL THEN NULL 
    ELSE strip_control_chars(milestone_description) 
  END,
  required_actions = sanitize_text_array(required_actions),
  success_criteria = sanitize_text_array(success_criteria);

-- Step 3: Clean any existing roadmap data for the problematic framework/customer
-- Delete milestones first (due to foreign key)
DELETE FROM public.compliance_roadmap_milestones
WHERE stage_id IN (
  SELECT id FROM public.compliance_roadmap_stages
  WHERE framework_id = 'bf88f79f-c7dd-472f-892c-1713d0879fec'::uuid
    AND customer_id = '4c2018fc-07a2-48bb-91a4-c2816d99e6f9'::uuid
);

-- Delete stages
DELETE FROM public.compliance_roadmap_stages
WHERE framework_id = 'bf88f79f-c7dd-472f-892c-1713d0879fec'::uuid
  AND customer_id = '4c2018fc-07a2-48bb-91a4-c2816d99e6f9'::uuid;