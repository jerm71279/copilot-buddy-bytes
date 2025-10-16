
-- Delete employee onboarding records for Acme Corporation
DELETE FROM employee_onboardings
WHERE customer_id = (
  SELECT id FROM customers WHERE company_name = 'Acme Corporation'
);
