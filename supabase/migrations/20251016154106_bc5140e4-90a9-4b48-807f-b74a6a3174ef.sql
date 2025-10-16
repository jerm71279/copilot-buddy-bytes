-- Seed Standard Employee Onboarding template with tasks
-- Template ID: 340c4b6a-3611-49d0-a55e-3a0f4d7900ef

INSERT INTO employee_onboarding_template_tasks (
  template_id,
  task_name,
  description,
  task_category,
  sequence_order,
  estimated_hours,
  assigned_role,
  requires_employee_input,
  compliance_tags
) VALUES
-- Demographics & Personal Info
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Collect Personal Information',
  'Gather employee legal name, date of birth, Social Security Number/Tax ID, home address, phone number, and emergency contact information',
  'Demographics',
  1,
  0.5,
  'HR Manager',
  true,
  ARRAY['PII', 'HR']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Setup Contact Details',
  'Configure work email address, work phone number, mobile number, and preferred contact methods',
  'Demographics',
  2,
  0.25,
  'IT Admin',
  true,
  ARRAY['HR']
),
-- Employment Details
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Document Employment Details',
  'Record employment start date, employment type (full-time/part-time/contract), work location, employee ID, and salary information',
  'Employment',
  3,
  0.5,
  'HR Manager',
  false,
  ARRAY['HR', 'Finance']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Assign Department',
  'Assign employee to appropriate department, team, and reporting manager. Update organizational chart',
  'Organization',
  4,
  0.25,
  'HR Manager',
  false,
  ARRAY['HR']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Configure Job Title and Responsibilities',
  'Set official job title, job level/grade, and provide detailed job description including key responsibilities and success metrics',
  'Organization',
  5,
  0.5,
  'HR Manager',
  false,
  ARRAY['HR']
),
-- IT & RBAC Setup
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Assign RBAC Profile and Permissions',
  'Configure role-based access control profile, assign appropriate system permissions, application access, and security groups based on job function',
  'IT Setup',
  6,
  1.0,
  'IT Admin',
  false,
  ARRAY['Security', 'IT', 'Compliance']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Create System Accounts',
  'Create user accounts for email, Active Directory/Azure AD, VPN, time tracking, HR system, and other required applications',
  'IT Setup',
  7,
  1.5,
  'IT Admin',
  false,
  ARRAY['IT', 'Security']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Prepare Workspace and Equipment',
  'Assign desk/workspace, provide computer hardware, monitor, keyboard, mouse, headset, phone, and any specialized equipment needed for role',
  'Logistics',
  8,
  2.0,
  'IT Admin',
  false,
  ARRAY['IT']
),
-- Benefits & Compliance
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Complete Benefits Enrollment',
  'Enroll in health insurance, dental, vision, 401(k), life insurance, and other company benefits. Provide benefit cards and documentation',
  'Benefits',
  9,
  1.0,
  'HR Manager',
  true,
  ARRAY['HR', 'Finance']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Complete Mandatory Training',
  'Complete required compliance training including security awareness, harassment prevention, code of conduct, data privacy (GDPR/CCPA), and industry-specific certifications',
  'Compliance',
  10,
  4.0,
  'HR Manager',
  true,
  ARRAY['Compliance', 'Security', 'HR']
),
-- Orientation
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Team Introductions and Orientation',
  'Schedule meetings with team members, manager, and key stakeholders. Provide team directory and organizational overview',
  'Orientation',
  11,
  2.0,
  'HR Manager',
  false,
  ARRAY['HR']
),
(
  '340c4b6a-3611-49d0-a55e-3a0f4d7900ef',
  'Set 30-60-90 Day Goals',
  'Establish clear performance objectives and success metrics for first 30, 60, and 90 days. Schedule regular check-ins with manager',
  'Orientation',
  12,
  1.0,
  'Manager',
  false,
  ARRAY['HR']
);