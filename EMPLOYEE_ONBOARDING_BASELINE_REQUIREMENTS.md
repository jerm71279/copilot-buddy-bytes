# Employee Onboarding Baseline Requirements
## Security-First Operational Readiness

**Version:** 1.0  
**Created:** October 13, 2025  
**Security Rating:** A (94/100) - Maintained Throughout  
**Purpose:** Define minimum requirements for employee operational readiness without compromising security

---

## Executive Summary

This document defines the **non-negotiable baseline requirements** to onboard employees onto the OberaConnect platform. Every item listed is **mandatory** - skipping any requirement will trigger a rollback or security incident.

### Core Principle
**"Security is not negotiable. Functionality follows security, never precedes it."**

### Success Criteria
- ✅ 100% compliance with baseline requirements
- ✅ Zero security compromises during onboarding
- ✅ No rollbacks needed post-implementation
- ✅ Employees operational on Day 1
- ✅ A (94/100) security rating maintained

---

## Table of Contents

1. [Infrastructure Prerequisites](#infrastructure-prerequisites)
2. [Security Baseline (Non-Negotiable)](#security-baseline-non-negotiable)
3. [Employee Account Requirements](#employee-account-requirements)
4. [Application Access Requirements](#application-access-requirements)
5. [Training Requirements](#training-requirements)
6. [Validation Gates](#validation-gates)
7. [Rollback Prevention](#rollback-prevention)
8. [Go/No-Go Checklist](#go-no-go-checklist)

---

## Infrastructure Prerequisites

### Platform Infrastructure (Must Complete BEFORE Any Employee Onboarding)

#### 1. Authentication System
**Status Required:** ✅ Fully Operational

- [x] **Supabase Auth Enabled**
  ```sql
  -- Verification query
  SELECT COUNT(*) FROM auth.users;
  -- Must return without error
  ```

- [x] **Password Policy Configured**
  - Minimum 12 characters
  - Uppercase + lowercase + number + special character
  - Password history (last 5 passwords)
  - ⚠️ **ACTION REQUIRED:** Enable leaked password protection
    - Navigate to Lovable Cloud → Authentication → Password Protection
    - Reference: https://docs.lovable.dev/features/security#leaked-password-protection-disabled

- [x] **Session Management Configured**
  - Idle timeout: 30 minutes
  - Absolute timeout: 8 hours
  - Automatic token refresh enabled
  - Session invalidation on password change

- [x] **Account Lockout Enabled**
  - Failed attempts threshold: 5
  - Lockout duration: 15 minutes
  - Auto-unlock after duration

**Validation:**
```bash
# Test user registration
# Test login with wrong password 6 times (should lock)
# Test password reset flow
# Test session timeout
```

---

#### 2. RBAC System (Role-Based Access Control)
**Status Required:** ✅ Deployed & Validated

- [x] **Database Schema Deployed**
  ```sql
  -- Verify all RBAC tables exist
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('roles', 'user_roles', 'role_permissions');
  -- Must return 3 rows
  ```

- [x] **Security Functions Deployed**
  ```sql
  -- Verify has_role() function exists with search_path protection (Oct 2025 fix)
  SELECT proname, prosrc FROM pg_proc 
  WHERE proname = 'has_role';
  -- Must include 'SET search_path = public'
  ```

- [x] **Default Roles Created**
  ```sql
  -- Verify default roles exist
  SELECT name FROM roles ORDER BY level DESC;
  -- Must return: Super Admin, Admin, Manager, User
  ```

- [x] **Role Permissions Matrix Defined**
  ```sql
  -- Verify permissions assigned
  SELECT r.name, COUNT(rp.id) as permission_count
  FROM roles r
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  GROUP BY r.name;
  -- Each role must have >0 permissions
  ```

**Validation:**
```sql
-- Test has_role() function
SELECT has_role('<test_user_id>', 'admin');

-- Test role assignment
INSERT INTO user_roles (user_id, role_id) VALUES (...);

-- Test role permission lookup
SELECT * FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'User');
```

---

#### 3. Row-Level Security (RLS)
**Status Required:** ✅ 100% Coverage on Critical Tables

- [x] **RLS Enabled on All Tables**
  ```sql
  -- Critical: Verify RLS enabled on 160 tables
  SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false;
  -- Must return ZERO rows for production tables
  ```

- [x] **RLS Policies Deployed**
  ```sql
  -- Verify policies exist for critical tables
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  HAVING COUNT(*) > 0;
  -- All user data tables must have policies
  ```

- [x] **Security Checkpoint: role_permissions Table**
  ```sql
  -- CRITICAL: Verify role_permissions is admin-only (Oct 2025 fix)
  SELECT policyname, cmd, qual 
  FROM pg_policies 
  WHERE tablename = 'role_permissions';
  -- Must NOT have any policy with 'true' USING clause
  -- Must have admin-only SELECT policy
  ```

**Validation:**
```sql
-- Test as regular user (should only see own org data)
SET ROLE authenticated;
SELECT * FROM user_profiles; -- Should filter by customer_id

-- Test as admin (should see org-wide data)
SELECT * FROM audit_logs; -- Should see org data if admin

-- Test role_permissions access (should fail for non-admin)
SELECT * FROM role_permissions; -- Should return permission denied
```

---

#### 4. Audit Logging
**Status Required:** ✅ Comprehensive Coverage

- [x] **Audit Log Table Exists**
  ```sql
  SELECT COUNT(*) FROM audit_logs;
  -- Must execute without error
  ```

- [x] **useAuditLog Hook Integrated**
  - Check critical components use the hook
  - Verify login/logout events logged
  - Verify role changes logged
  - Verify privileged access logged

- [x] **Audit Log Protection**
  ```sql
  -- Verify audit_logs has RLS enabled
  SELECT rowsecurity FROM pg_tables 
  WHERE tablename = 'audit_logs';
  -- Must return true
  
  -- Verify no DELETE policy exists (logs are immutable)
  SELECT * FROM pg_policies 
  WHERE tablename = 'audit_logs' AND cmd = 'DELETE';
  -- Must return ZERO rows
  ```

**Validation:**
```typescript
// Test audit logging
import { useAuditLog } from '@/hooks/useAuditLog';

const { logAction } = useAuditLog();

await logAction({
  system_name: 'test',
  action_type: 'test_action',
  action_details: { test: true }
});

// Verify log entry created in audit_logs table
```

---

#### 5. Database Performance & Integrity
**Status Required:** ✅ Optimized for Production Load

- [x] **Indexes Created**
  ```sql
  -- Verify indexes on foreign keys and frequently queried columns
  SELECT 
    schemaname,
    tablename,
    indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('user_profiles', 'user_roles', 'audit_logs')
  ORDER BY tablename;
  -- Key tables must have appropriate indexes
  ```

- [x] **Connection Pooling Configured**
  - Supabase connection pooler enabled
  - Max connections appropriate for expected load

- [x] **Backup & Recovery Tested**
  - Point-in-time recovery enabled
  - Backup retention: 30 days minimum
  - Recovery tested successfully

**Validation:**
```sql
-- Test query performance
EXPLAIN ANALYZE 
SELECT * FROM user_profiles WHERE customer_id = '<customer_id>';
-- Should use index scan, not seq scan

-- Verify backup configuration
-- (Check in Lovable Cloud dashboard)
```

---

## Security Baseline (Non-Negotiable)

### Critical Security Controls (Never Compromise)

#### 1. No Public Data Access
**Rule:** No table should have a policy allowing public access with `true` USING clause

```sql
-- VERIFICATION QUERY - Must return ZERO rows
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND qual = 'true'::text;
```

**If this returns any rows:** STOP. Fix before proceeding.

---

#### 2. No Client-Side Admin Checks
**Rule:** Never check admin status via localStorage, sessionStorage, or hardcoded credentials

```typescript
// ❌ WRONG - Client-side admin check
if (localStorage.getItem('isAdmin') === 'true') {
  // Show admin features
}

// ✅ CORRECT - Server-side validation via RLS
const { data } = await supabase
  .from('admin_only_table')
  .select('*');
// RLS policy enforces admin check server-side
```

**Validation:**
```bash
# Search codebase for violations
grep -r "localStorage.*admin" src/
grep -r "sessionStorage.*admin" src/
grep -r "isAdmin.*true" src/
# Must return ZERO matches
```

---

#### 3. All SECURITY DEFINER Functions Have search_path
**Rule:** Every SECURITY DEFINER function must have `SET search_path = public` (Oct 2025 fix)

```sql
-- VERIFICATION QUERY
SELECT 
  proname,
  prosecdef,
  proconfig
FROM pg_proc
WHERE prosecdef = true
  AND pronamespace = 'public'::regnamespace
  AND (proconfig IS NULL OR NOT 'search_path=public' = ANY(proconfig));
-- Should return minimal results (only reserved schema functions)
```

**If this returns functions you created:** Add search_path before proceeding.

---

#### 4. Sensitive Data Never Logged
**Rule:** Never log passwords, tokens, or PII to console

```typescript
// ❌ WRONG
console.log('User logged in:', { email, password });

// ✅ CORRECT
console.log('User logged in:', { email }); // No password
```

**Validation:**
```bash
# Search for logging violations
grep -r "console.log.*password" src/
grep -r "console.log.*token" src/
# Must return ZERO matches in production code
```

---

#### 5. Input Validation Everywhere
**Rule:** All user inputs must be validated using Zod schemas

```typescript
// ✅ CORRECT - Always validate
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(100)
});

const result = loginSchema.safeParse(formData);
if (!result.success) {
  return { error: result.error };
}
```

**Validation:**
```bash
# Verify Zod is used for auth forms
grep -r "z.object" src/pages/Auth.tsx
# Must find validation schemas
```

---

## Employee Account Requirements

### Minimum Data Required Per Employee

Every employee account MUST have:

#### 1. User Authentication Record
- ✅ Email (validated format)
- ✅ Password (12+ chars, complexity, hashed)
- ✅ Email confirmed (auto-confirm enabled for non-prod)
- ✅ Account active (not locked)

```sql
-- Verification per user
SELECT 
  id,
  email,
  email_confirmed_at,
  banned_until,
  deleted_at
FROM auth.users
WHERE email = 'employee@company.com';
-- Must have email_confirmed_at populated
-- Must NOT have banned_until or deleted_at
```

---

#### 2. User Profile Record
- ✅ user_id (linked to auth.users)
- ✅ email
- ✅ full_name
- ✅ department
- ✅ customer_id (organization)
- ✅ created_at / updated_at

```sql
-- Verification per user
SELECT 
  user_id,
  email,
  full_name,
  department,
  customer_id
FROM user_profiles
WHERE email = 'employee@company.com';
-- All fields must be populated
```

---

#### 3. Role Assignment
- ✅ At minimum, "User" role assigned
- ✅ Elevated roles (Admin/Manager) properly justified and approved

```sql
-- Verification per user
SELECT 
  up.email,
  r.name as role_name,
  ur.granted_at,
  ur.granted_by
FROM user_profiles up
JOIN user_roles ur ON ur.user_id = up.user_id
JOIN roles r ON r.id = ur.role_id
WHERE up.email = 'employee@company.com';
-- Must return at least one role (User)
```

**Rollback Trigger:** If ANY user has zero roles, STOP and fix.

---

#### 4. Application Access
- ✅ Department-based application access configured
- ✅ Role-based application access configured
- ✅ Application launcher shows appropriate apps

```sql
-- Verification per department/role
SELECT 
  a.name as application_name,
  aa.department,
  r.name as role_name
FROM applications a
LEFT JOIN application_access aa ON aa.application_id = a.id
LEFT JOIN roles r ON r.id = aa.role_id
WHERE a.is_active = true
  AND (aa.department = 'IT' OR r.name = 'User');
-- Must return applications for user's department/role
```

---

#### 5. Audit Baseline Established
- ✅ Initial login captured in audit_logs
- ✅ Security baseline created
- ✅ Anomaly detection rules configured

```sql
-- Verification after first login
SELECT 
  user_id,
  system_name,
  action_type,
  created_at
FROM audit_logs
WHERE user_id = '<user_id>'
  AND action_type = 'login_success'
ORDER BY created_at DESC
LIMIT 1;
-- Must have at least one login_success entry
```

---

## Application Access Requirements

### Minimum Application Access Per Role

#### User Role (Standard Employee)
**Purpose:** Day-to-day operations within assigned department

Required Access:
- ✅ Portal Dashboard (personal view)
- ✅ Department Dashboard (department-specific)
- ✅ Employee Directory (view only)
- ✅ Knowledge Base (search and view)
- ✅ AI Assistant (department context)
- ✅ Time Tracking (own entries)
- ✅ Leave Management (own requests)

Optional Access (Department-Specific):
- IT: CMDB (view only), Incidents, Service Requests
- HR: Employee Onboarding, Leave Approvals
- Finance: Expense Management, Invoice Management
- Sales: Leads, Opportunities, Quotes
- Operations: Project Management, Inventory

---

#### Manager Role
**Purpose:** Team oversight and approval workflows

Required Access (All of User Role +):
- ✅ Team Dashboard (team visibility)
- ✅ Team Member Profiles (view/edit for direct reports)
- ✅ Approval Workflows (leave, expenses, time off)
- ✅ Team Reports (performance, utilization)
- ✅ Department AI Assistant (enhanced context)

---

#### Admin Role
**Purpose:** Organization-wide management and configuration

Required Access (All of Manager Role +):
- ✅ Admin Dashboard (organization-wide)
- ✅ User Management (create/edit/disable users)
- ✅ Role Management (assign/revoke roles)
- ✅ Application Management (configure access)
- ✅ Audit Logs (read-only for compliance)
- ✅ System Configuration (limited settings)
- ✅ Reports & Analytics (organization-wide)

---

#### Super Admin Role
**Purpose:** Full platform administration and security

Required Access (All of Admin Role +):
- ✅ Security Configuration (RBAC, RLS)
- ✅ Integration Management (external systems)
- ✅ Compliance Settings (frameworks, controls)
- ✅ System-Level Configuration (all settings)
- ✅ Break-Glass Access Approvals
- ✅ Security Monitoring Dashboard

---

## Training Requirements

### Mandatory Training (100% Completion Required)

#### 1. Security Awareness Training (All Employees)
**Duration:** 30 minutes  
**Format:** Live session or recorded video  
**Completion:** BEFORE first login

Topics Covered:
- ✅ Password security and MFA
- ✅ Phishing recognition
- ✅ Data classification
- ✅ Incident reporting
- ✅ Acceptable use policy

**Validation:**
```sql
-- Verify training completion
SELECT 
  up.email,
  up.full_name,
  tc.training_type,
  tc.completed_at,
  tc.quiz_score
FROM user_profiles up
LEFT JOIN training_completion tc ON tc.user_id = up.user_id
WHERE up.email = 'employee@company.com'
  AND tc.training_type = 'security_awareness';
-- Must have completed_at populated and quiz_score >= 80%
```

**Rollback Trigger:** <100% training completion before go-live

---

#### 2. Platform Navigation Training (All Employees)
**Duration:** 30 minutes  
**Format:** Live demo or self-paced  
**Completion:** Day 1 of employment

Topics Covered:
- ✅ Dashboard navigation
- ✅ Department-specific features
- ✅ Application launcher
- ✅ AI assistant usage
- ✅ Support resources

**Validation:** Post-training survey + observation during first week

---

#### 3. Role-Specific Training (Elevated Roles Only)

**Admin Training:**
- Duration: 45 minutes
- Topics: User management, role assignment, audit log review
- Completion: BEFORE admin privileges granted

**Manager Training:**
- Duration: 20 minutes
- Topics: Team oversight, approval workflows, team reporting
- Completion: BEFORE manager privileges granted

**Validation:**
```sql
-- Verify elevated role training before privilege grant
SELECT 
  up.email,
  r.name as role_name,
  ur.granted_at,
  tc.completed_at as training_completed
FROM user_roles ur
JOIN user_profiles up ON up.user_id = ur.user_id
JOIN roles r ON r.id = ur.role_id
LEFT JOIN training_completion tc ON tc.user_id = ur.user_id 
  AND tc.training_type = LOWER(r.name) || '_training'
WHERE r.name IN ('Admin', 'Manager')
  AND ur.granted_at < tc.completed_at;
-- Must return ZERO rows (training must complete BEFORE privilege grant)
```

---

## Validation Gates

### Pre-Go-Live Quality Gates (All Must Pass)

#### Gate 1: Infrastructure Validation
**Owner:** IT Team + Security Team  
**Timeline:** Week 0, Day 3

Checklist:
- [ ] All authentication tests pass
- [ ] All RBAC tests pass
- [ ] All RLS policies validated
- [ ] All audit logging working
- [ ] Performance benchmarks met
- [ ] Backup/recovery tested

**Go/No-Go Decision:** All items must be checked to proceed

---

#### Gate 2: Security Validation
**Owner:** Security Team  
**Timeline:** Week 1, Day 3

Checklist:
- [ ] role_permissions table is admin-only
- [ ] All SECURITY DEFINER functions have search_path
- [ ] No public data access policies
- [ ] No client-side admin checks
- [ ] No sensitive data in logs
- [ ] Input validation on all forms
- [ ] Leaked password protection enabled

**Go/No-Go Decision:** All items must be checked to proceed

---

#### Gate 3: Employee Readiness Validation
**Owner:** HR Team + Security Team  
**Timeline:** Week 2, Day 5

Checklist:
- [ ] 100% of employees have accounts
- [ ] 100% of employees have roles assigned
- [ ] 100% of employees have application access
- [ ] 100% of employees completed security training
- [ ] 100% of employees passed training quiz (>=80%)
- [ ] All elevated access requests approved
- [ ] All security baselines established

**Go/No-Go Decision:** 100% completion required to proceed

---

#### Gate 4: Support Readiness Validation
**Owner:** All Teams  
**Timeline:** Week 2, Day 5

Checklist:
- [ ] Help desk staffed for first week
- [ ] Escalation paths defined
- [ ] Runbooks created for common issues
- [ ] Backup personnel identified
- [ ] Communication plan ready
- [ ] Feedback collection method ready

**Go/No-Go Decision:** All items must be checked to proceed

---

## Rollback Prevention

### Common Pitfalls & Prevention

#### Pitfall 1: Rushing Infrastructure Setup
**Symptom:** Authentication failures, permission errors on Day 1  
**Prevention:**
- ✅ Complete all infrastructure prerequisites BEFORE creating any employee accounts
- ✅ Test with pilot user account before bulk creation
- ✅ Run all validation queries and confirm zero errors

**Rollback Trigger:** >10% authentication failures on Day 1

---

#### Pitfall 2: Skipping Security Training
**Symptom:** Security incidents in first 30 days  
**Prevention:**
- ✅ Make training mandatory (no access until complete)
- ✅ Track completion with database records
- ✅ Require passing quiz score (>=80%)
- ✅ Block login for users without training completion

**Rollback Trigger:** Any security incident attributable to lack of training

---

#### Pitfall 3: Incorrect Role Assignments
**Symptom:** Users can't access needed resources OR users have excessive permissions  
**Prevention:**
- ✅ Document role requirements clearly before assignment
- ✅ Have managers approve role assignments
- ✅ Conduct role validation before Day 1
- ✅ Test with pilot users from each department

**Rollback Trigger:** >20% access-related support tickets on Day 1

---

#### Pitfall 4: Missing Audit Logging
**Symptom:** Cannot track security events, compliance failure  
**Prevention:**
- ✅ Verify audit logging in infrastructure validation (Gate 1)
- ✅ Test logging with sample events before go-live
- ✅ Confirm audit log entries exist for all test users
- ✅ Set up real-time monitoring of audit log volume

**Rollback Trigger:** Audit logs not capturing critical events

---

#### Pitfall 5: Insufficient Testing
**Symptom:** Unexpected errors, poor performance, user confusion  
**Prevention:**
- ✅ Run pilot with 5-10 users from different departments
- ✅ Conduct full end-to-end testing
- ✅ Load test with expected concurrent users
- ✅ Document and fix all issues before full rollout

**Rollback Trigger:** >15% of pilot users report blocking issues

---

## Go/No-Go Checklist

### Final Pre-Launch Validation (Day Before Go-Live)

**Infrastructure:**
- [ ] Authentication system: 100% functional
- [ ] RBAC system: 100% functional
- [ ] RLS policies: 100% coverage, 100% tested
- [ ] Audit logging: 100% coverage, logs flowing
- [ ] Database performance: All queries <500ms
- [ ] Backup/recovery: Tested and verified

**Security:**
- [ ] Security rating: A (94/100) maintained
- [ ] role_permissions: Admin-only access confirmed
- [ ] SECURITY DEFINER functions: All have search_path
- [ ] No public data access: Verified with SQL query
- [ ] No client-side admin checks: Verified with code search
- [ ] Input validation: Zod schemas on all forms
- [ ] ⚠️ Leaked password protection: Enabled (manual check)

**Employee Accounts:**
- [ ] 100% of employees have active accounts
- [ ] 100% of employees have user_profiles records
- [ ] 100% of employees have at least "User" role
- [ ] 100% of elevated roles approved by security
- [ ] 100% of employees have department assignment
- [ ] 100% of employees have application access

**Training:**
- [ ] 100% security training completion
- [ ] 100% training quiz scores >=80%
- [ ] 100% platform navigation training
- [ ] 100% elevated role training (for admins/managers)
- [ ] All training certificates issued

**Support Readiness:**
- [ ] Help desk staffed (HR, IT, Security)
- [ ] Escalation paths documented
- [ ] Runbooks ready for top 10 issues
- [ ] Backup personnel identified
- [ ] Communication plan ready (welcome emails, etc.)

**Quality Gates:**
- [ ] Gate 1 (Infrastructure): PASSED
- [ ] Gate 2 (Security): PASSED
- [ ] Gate 3 (Employee Readiness): PASSED
- [ ] Gate 4 (Support Readiness): PASSED

---

## Decision Matrix

| All Checklist Items | Result |
|---------------------|--------|
| ✅ All checked | **GO** - Proceed with go-live |
| ❌ 1-2 minor items unchecked | **CONDITIONAL GO** - Fix within 24 hours, monitor closely |
| ❌ 3+ items unchecked OR 1 critical item | **NO-GO** - Delay go-live, fix all issues |

**Critical Items (Any failure = NO-GO):**
1. Security rating below A (94/100)
2. role_permissions table publicly accessible
3. <95% employee accounts created
4. <95% training completion
5. Any Gate 1 or Gate 2 failure

---

## Appendix: Quick Reference Commands

### Verify Infrastructure Readiness

```sql
-- Run all validation queries in sequence
-- Authentication
SELECT COUNT(*) FROM auth.users; -- Must execute

-- RBAC
SELECT COUNT(*) FROM roles; -- Must return 4+
SELECT COUNT(*) FROM user_roles; -- Must return employee count
SELECT COUNT(*) FROM role_permissions; -- Must return >0

-- RLS
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false; -- Must return 0

-- Audit Logging
SELECT COUNT(*) FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '1 day'; -- Must return >0

-- Security Checkpoints
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'role_permissions' 
AND cmd = 'SELECT' 
AND qual = 'true'::text; -- Must return 0

-- SECURITY DEFINER Functions
SELECT COUNT(*) FROM pg_proc 
WHERE prosecdef = true 
AND 'search_path=public' = ANY(proconfig); -- Should match total SECURITY DEFINER count
```

### Verify Employee Account

```sql
-- Complete employee account validation
WITH employee AS (
  SELECT '<employee_email>' as email
),
auth_check AS (
  SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as auth_status
  FROM auth.users u, employee e
  WHERE u.email = e.email
),
profile_check AS (
  SELECT 
    up.user_id,
    up.email,
    up.full_name,
    up.department,
    up.customer_id,
    CASE WHEN up.customer_id IS NOT NULL THEN '✅' ELSE '❌' END as profile_status
  FROM user_profiles up, employee e
  WHERE up.email = e.email
),
role_check AS (
  SELECT 
    up.user_id,
    array_agg(r.name) as roles,
    CASE WHEN COUNT(r.id) > 0 THEN '✅' ELSE '❌' END as role_status
  FROM user_profiles up, employee e
  JOIN user_roles ur ON ur.user_id = up.user_id
  JOIN roles r ON r.id = ur.role_id
  WHERE up.email = e.email
  GROUP BY up.user_id
),
training_check AS (
  SELECT 
    up.user_id,
    COUNT(tc.id) as trainings_completed,
    CASE WHEN COUNT(tc.id) >= 1 THEN '✅' ELSE '❌' END as training_status
  FROM user_profiles up, employee e
  LEFT JOIN training_completion tc ON tc.user_id = up.user_id
  WHERE up.email = e.email
  GROUP BY up.user_id
)
SELECT 
  a.email,
  a.auth_status,
  p.profile_status,
  r.role_status,
  r.roles,
  t.training_status,
  CASE 
    WHEN a.auth_status = '✅' 
    AND p.profile_status = '✅' 
    AND r.role_status = '✅' 
    AND t.training_status = '✅' 
    THEN '✅ READY' 
    ELSE '❌ NOT READY' 
  END as overall_status
FROM auth_check a
JOIN profile_check p ON p.user_id = a.id
JOIN role_check r ON r.user_id = a.id
JOIN training_check t ON t.user_id = a.id;
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 13, 2025 | Security Team + IT | Initial baseline requirements |

**Next Review:** Post-implementation (Week 4)  
**Owner:** Security Manager/CISO + IT Director  
**Classification:** Internal Use Only  
**Related Documents:**
- SECURITY_MASTER_PLAN.md
- EMPLOYEE_ONBOARDING_MASTER_PLAN.md
- SECURITY_TEAM_EMPLOYEE_ONBOARDING_PLAN.md
- SECURITY_FIXES_APPLIED.md
