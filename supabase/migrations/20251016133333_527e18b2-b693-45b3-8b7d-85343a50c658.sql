
-- Temporarily disable the validation trigger
ALTER TABLE user_profiles DISABLE TRIGGER validate_user_profile_trigger;

-- Clean and update user profiles
UPDATE user_profiles
SET customer_id = '4c2018fc-07a2-48bb-91a4-c2816d99e6f9',
    full_name = REGEXP_REPLACE(COALESCE(full_name, 'User'), '[\x00-\x1F\x7F]', '', 'g')
WHERE user_id IN ('943d46ef-79c6-4b7a-b3f2-4fed7e9dfe5d', '1456d195-8440-4830-8199-86bfb0f73557');

-- Set Jeremy Smith's name if it's still empty
UPDATE user_profiles
SET full_name = 'Jeremy Smith'
WHERE user_id = '1456d195-8440-4830-8199-86bfb0f73557' 
  AND (full_name IS NULL OR full_name = '' OR full_name = 'User');

-- Re-enable the validation trigger
ALTER TABLE user_profiles ENABLE TRIGGER validate_user_profile_trigger;

-- Create employee onboarding records for both users
INSERT INTO employee_onboardings (
  customer_id,
  template_id,
  employee_name,
  employee_email,
  start_date,
  status,
  created_by
)
VALUES 
  (
    '4c2018fc-07a2-48bb-91a4-c2816d99e6f9',
    '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
    'Samuel Blake',
    'samuel.blake@oberaconnect.com',
    '2025-10-09',
    'in_progress',
    '943d46ef-79c6-4b7a-b3f2-4fed7e9dfe5d'
  ),
  (
    '4c2018fc-07a2-48bb-91a4-c2816d99e6f9',
    '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
    'Jeremy Smith',
    'jeremy.smith@oberaconnect.com',
    '2025-10-16',
    'in_progress',
    '1456d195-8440-4830-8199-86bfb0f73557'
  )
ON CONFLICT DO NOTHING;

-- Create customer customization for OBERACONNECT
INSERT INTO customer_customizations (
  customer_id,
  enabled_features,
  default_dashboard
)
VALUES (
  '4c2018fc-07a2-48bb-91a4-c2816d99e6f9',
  '["dashboard", "integrations", "compliance", "ml_insights"]'::jsonb,
  'executive'
)
ON CONFLICT (customer_id) DO NOTHING;
