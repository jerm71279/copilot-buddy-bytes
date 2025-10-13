# Employee Security Onboarding Checklist - First Iteration

**Version:** 1.0  
**Last Updated:** October 2025  
**Purpose:** Step-by-step baseline checklist for integrating all employees into the OberaConnect security framework

---

## Overview

This checklist provides a structured approach to onboard all employees into the security system during the first implementation iteration. This represents the **baseline starting point** for enterprise-wide security integration.

**Timeline:** 2-3 weeks for full employee integration  
**Prerequisites:** Core Security Infrastructure (Phase 1) must be completed

---

## Pre-Onboarding Setup (Admin Tasks)

### ✅ Step 1: Verify Core Infrastructure
**Owner:** IT Admin/Security Team  
**Duration:** 1 day

- [ ] Confirm authentication system is operational
- [ ] Verify RBAC tables and policies are deployed
- [ ] Test user registration and login flows
- [ ] Confirm audit logging is active
- [ ] Verify email auto-confirm is enabled (for non-production)

**Validation:**
```sql
-- Check RLS policies are active
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_roles', 'audit_logs');

-- Verify role enum exists
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype;
```

---

### ✅ Step 2: Create Default Role Structure
**Owner:** Security Admin  
**Duration:** 2 hours

Create the baseline role hierarchy for your organization:

- [ ] **Super Admin** (1-2 people) - Full system access
- [ ] **Admin** (Department heads) - Departmental management
- [ ] **Manager** (Team leads) - Team oversight
- [ ] **User** (All employees) - Standard access

**Implementation:**
```sql
-- Verify roles exist in enum
-- If needed, roles should have been created during Phase 1

-- Create role assignment template
INSERT INTO user_roles (user_id, role) VALUES
  -- Will be populated per employee
```

---

### ✅ Step 3: Prepare Department Structure
**Owner:** HR + IT Admin  
**Duration:** 4 hours

- [ ] List all departments in the organization
- [ ] Identify department heads/managers
- [ ] Map employees to departments
- [ ] Define department-specific access requirements

**Template Spreadsheet Columns:**
```
Employee Name | Email | Department | Role | Manager | Start Date | Special Access
```

---

## Employee Onboarding Process

### ✅ Step 4: Batch Employee Account Creation
**Owner:** IT Admin  
**Duration:** 1-2 days (depending on employee count)

#### Option A: Manual Creation (Small teams <50)
For each employee:

1. [ ] Navigate to Admin Dashboard
2. [ ] Create user account with email
3. [ ] Assign to correct department
4. [ ] Assign default "User" role
5. [ ] Send welcome email with credentials

#### Option B: Bulk Import (Large teams >50)
1. [ ] Prepare CSV with employee data
2. [ ] Use bulk import script (see below)
3. [ ] Validate all accounts created
4. [ ] Send batch welcome emails

**Bulk Import Script:**
```typescript
// Run via edge function or admin script
const employees = [
  { email: 'john@company.com', department: 'IT', role: 'user' },
  // ... more employees
];

for (const emp of employees) {
  // Create auth user
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: emp.email,
    email_confirm: true,
    user_metadata: {
      department: emp.department
    }
  });
  
  // Create profile
  await supabase.from('user_profiles').insert({
    user_id: authUser.user.id,
    email: emp.email,
    department: emp.department,
    customer_id: YOUR_CUSTOMER_ID
  });
  
  // Assign role
  await supabase.from('user_roles').insert({
    user_id: authUser.user.id,
    role: emp.role
  });
}
```

---

### ✅ Step 5: Assign Elevated Roles
**Owner:** Security Admin  
**Duration:** 2 hours

After basic accounts are created:

- [ ] Identify employees needing Admin access
- [ ] Identify employees needing Manager access
- [ ] Assign elevated roles via RBACPortal
- [ ] Document all elevated role assignments
- [ ] Log assignments in audit trail

**Process:**
1. Go to `/rbac` (RBAC Portal)
2. Navigate to "Roles" tab
3. For each elevated user:
   - Search by email
   - Assign appropriate role
   - Add justification note
4. Verify assignment appears in Audit Log

---

### ✅ Step 6: Configure Department Access
**Owner:** Department Heads  
**Duration:** 1 day

For each department:

- [ ] Review department members list
- [ ] Configure department-specific dashboards
- [ ] Set up department AI assistant context
- [ ] Define department data access rules
- [ ] Test department filtering/isolation

**Departments to Configure:**
- [ ] IT
- [ ] HR  
- [ ] Finance
- [ ] Sales
- [ ] Operations
- [ ] Executive
- [ ] Customer Support

---

### ✅ Step 7: Application Access Assignment
**Owner:** IT Admin  
**Duration:** 3 hours

- [ ] Review list of integrated applications
- [ ] Determine which roles/departments need access
- [ ] Assign application access via Admin Dashboard
- [ ] Test application launcher for different roles

**Navigate to:** `/applications-admin`

For each application:
1. Select application
2. Assign to departments or roles
3. Set display order
4. Test access for sample users

---

### ✅ Step 8: Enable Audit Logging for All Users
**Owner:** Security Team  
**Duration:** 1 hour

- [ ] Verify `useAuditLog` hook is integrated in critical components
- [ ] Enable privileged access logging
- [ ] Set up audit log retention policy (recommend 90 days minimum)
- [ ] Configure audit alerts for suspicious activity

**Key Audit Points:**
- Login/logout events
- Role changes
- Permission modifications
- Privileged system access
- Data exports

---

## Employee Training & Communication

### ✅ Step 9: Security Awareness Training
**Owner:** HR + Security Team  
**Duration:** 1 week

#### Session 1: Security Basics (30 minutes)
- [ ] Schedule training sessions
- [ ] Cover authentication best practices
- [ ] Explain role-based access
- [ ] Demonstrate password requirements
- [ ] Explain MFA (if implemented)

**Topics:**
- How to log in securely
- Password best practices
- Recognizing phishing
- Reporting security incidents
- Data classification basics

#### Session 2: Platform Navigation (30 minutes)
- [ ] Tour of dashboard
- [ ] Department-specific features
- [ ] Application launcher demo
- [ ] AI assistant introduction
- [ ] Help/support resources

---

### ✅ Step 10: Documentation & Resources
**Owner:** IT Team  
**Duration:** 2 hours

Provide employees with:

- [ ] Welcome email with login instructions
- [ ] Quick start guide (1-page PDF)
- [ ] FAQs document
- [ ] Support contact information
- [ ] Password reset procedures

**Create:** `EMPLOYEE_QUICK_START_GUIDE.md`

---

## Post-Onboarding Validation

### ✅ Step 11: Access Verification
**Owner:** Security Team  
**Duration:** 1 day

- [ ] Verify all employees can log in
- [ ] Check department assignment accuracy
- [ ] Validate role assignments
- [ ] Test application access per role
- [ ] Review audit logs for onboarding activity

**Validation Queries:**
```sql
-- Count employees by department
SELECT department, COUNT(*) 
FROM user_profiles 
GROUP BY department;

-- Count role assignments
SELECT role, COUNT(*) 
FROM user_roles 
GROUP BY role;

-- Check for users without roles (should be 0)
SELECT user_id, email 
FROM user_profiles 
WHERE user_id NOT IN (SELECT user_id FROM user_roles);
```

---

### ✅ Step 12: Security Baseline Review
**Owner:** Security Team  
**Duration:** 2 hours

- [ ] Review all audit logs from onboarding
- [ ] Check for failed login attempts
- [ ] Verify no privilege escalation attempts
- [ ] Confirm RLS policies are working
- [ ] Document any issues encountered

---

### ✅ Step 13: Feedback Collection
**Owner:** HR  
**Duration:** 1 week

- [ ] Send onboarding survey to all employees
- [ ] Collect feedback on process clarity
- [ ] Identify pain points
- [ ] Document improvement suggestions
- [ ] Schedule follow-up sessions if needed

**Survey Questions:**
1. Was the onboarding process clear?
2. Can you access the tools you need?
3. Do you understand your role and permissions?
4. What was confusing or difficult?
5. What could be improved?

---

## Troubleshooting Common Issues

### Issue: Employee Can't Log In
**Solution:**
1. Verify email is correct in system
2. Check if email was confirmed (auto-confirm should be ON)
3. Verify user_profile record exists
4. Check RLS policies aren't blocking access
5. Reset password if needed

### Issue: Employee Has Wrong Permissions
**Solution:**
1. Check assigned role in `user_roles` table
2. Verify customer_id is correct on profile
3. Check department assignment
4. Review RLS policies for the specific table

### Issue: Department Dashboard Not Showing
**Solution:**
1. Confirm department field is set on user_profile
2. Check department name spelling (case-sensitive)
3. Verify routing rules in `DashboardNavigation.tsx`
4. Clear browser cache

### Issue: Application Not Accessible
**Solution:**
1. Check `application_access` table for role/department assignment
2. Verify application is marked as `is_active`
3. Check if user's role has access
4. Review RLS policies on applications table

---

## Ongoing Maintenance

### Weekly Tasks
- [ ] Review new employee additions
- [ ] Process role change requests
- [ ] Review audit logs for anomalies
- [ ] Address access issues

### Monthly Tasks
- [ ] Audit user list for inactive accounts
- [ ] Review role assignments
- [ ] Update documentation
- [ ] Conduct random access reviews

### Quarterly Tasks
- [ ] Full security access audit
- [ ] Review and update role definitions
- [ ] Employee security refresher training
- [ ] Compliance reporting

---

## Success Metrics

Track these metrics to measure onboarding success:

- **Time to First Login:** Average time from account creation to first successful login
- **Access Issues:** Number of support tickets related to access problems
- **Role Assignment Accuracy:** Percentage of correct role assignments
- **Training Completion:** Percentage of employees completing security training
- **User Satisfaction:** Average rating from onboarding survey

**Target Goals:**
- 100% of employees with active accounts
- <5% access-related support tickets
- >95% role assignment accuracy
- 100% training completion
- >4.0/5.0 satisfaction rating

---

## Appendix A: Role Permission Matrix

| Role | Dashboard Access | User Management | System Config | Audit Logs | Reports |
|------|-----------------|-----------------|---------------|------------|---------|
| **User** | Own dept only | None | None | Own only | Own dept |
| **Manager** | Own dept | Team members | None | Team only | Own dept |
| **Admin** | All depts | All users | Limited | All | All |
| **Super Admin** | All depts | All users | Full | All | All |

---

## Appendix B: Integration with Existing Systems

### NinjaOne RMM
- Sync employee device assignments
- Link audit logs for privileged access
- Track device compliance per employee

### CIPP (Microsoft 365)
- Sync Azure AD users
- Map M365 licenses to profiles
- Track conditional access policies

### Compliance Framework
- Tag employees with required compliance
- Track training completion
- Generate compliance reports per employee

---

## Appendix C: Quick Reference Commands

### Check User Status
```sql
SELECT 
  up.email,
  up.department,
  array_agg(ur.role) as roles,
  up.created_at
FROM user_profiles up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
WHERE up.email = 'employee@company.com'
GROUP BY up.email, up.department, up.created_at;
```

### Assign Role to User
```sql
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM user_profiles
WHERE email = 'manager@company.com';
```

### Bulk Update Department
```sql
UPDATE user_profiles
SET department = 'Sales'
WHERE email IN ('user1@company.com', 'user2@company.com');
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 2025 | Security Team | Initial baseline checklist |

**Next Review:** 30 days post-implementation
**Owner:** Chief Security Officer
**Classification:** Internal Use Only
