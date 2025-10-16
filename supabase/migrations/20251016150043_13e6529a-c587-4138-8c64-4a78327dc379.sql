
-- Backfill employees table for existing users (without ON CONFLICT)
INSERT INTO employees (
  customer_id,
  first_name,
  last_name,
  email,
  phone,
  job_title,
  employment_type,
  employment_status,
  hire_date
)
SELECT 
  up.customer_id,
  COALESCE(SPLIT_PART(up.full_name, ' ', 1), up.full_name) as first_name,
  COALESCE(NULLIF(SUBSTRING(up.full_name FROM POSITION(' ' IN up.full_name) + 1), ''), '') as last_name,
  au.email,
  '' as phone,
  COALESCE(up.department, 'Employee') as job_title,
  'full_time' as employment_type,
  'active' as employment_status,
  COALESCE(up.created_at::date, CURRENT_DATE) as hire_date
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE up.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.email = au.email 
    AND e.customer_id = up.customer_id
  );
