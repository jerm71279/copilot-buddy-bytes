# IT Team - Employee Security Onboarding Plan

**Version:** 1.0  
**Department:** Information Technology  
**Timeline:** 2-3 weeks  
**Team Lead:** IT Manager/Director

---

## IT Team Responsibilities Overview

The IT team is responsible for:
- Creating and configuring all user accounts
- Assigning system access and permissions
- Setting up hardware and workstations
- Implementing RBAC roles
- Managing application access
- Technical troubleshooting and support

---

## Pre-Implementation Phase (Days 1-2)

### Day 1: Infrastructure Validation

**Time Allocation:** 4 hours  
**Owner:** IT Admin + Security Team

#### Tasks:
- [ ] **Verify authentication system is operational**
  - Test login/signup flows
  - Confirm email auto-confirm is enabled
  - Test password reset functionality
  - Verify session persistence

- [ ] **Check database connectivity**
  ```sql
  -- Verify key tables exist
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_roles', 'roles', 'audit_logs');
  ```

- [ ] **Validate RLS policies**
  ```sql
  -- Check RLS is enabled on critical tables
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_roles', 'audit_logs');
  ```

- [ ] **Test RBAC functionality**
  - Create test user with 'User' role
  - Create test user with 'Admin' role
  - Verify role-based access works correctly
  - Test department filtering

**Deliverable:** Infrastructure validation report

---

### Day 2: System Preparation

**Time Allocation:** 6 hours  
**Owner:** IT Admin

#### Tasks:
- [ ] **Prepare bulk account creation tools**
  - Set up edge function for bulk user creation
  - Test with 3-5 sample accounts
  - Prepare CSV template for HR data import
  
  CSV Template:
  ```
  email,full_name,department,job_title,start_date,manager_email
  ```

- [ ] **Configure application catalog**
  - Navigate to `/applications-admin`
  - Verify all applications are listed
  - Set display order
  - Configure application icons
  - Test application launcher

- [ ] **Prepare hardware inventory**
  - List available computers
  - Assign device serial numbers
  - Prepare workstation setup checklist
  - Stage equipment for new employees

- [ ] **Create standard email templates**
  - Welcome email with credentials
  - Password reset instructions
  - System access guide
  - Troubleshooting FAQ

**Deliverable:** System preparation checklist completed

---

## Implementation Phase (Days 3-12)

### Days 3-5: Bulk Account Creation

**Time Allocation:** 3 days (6 hours/day)  
**Owner:** IT Admin + Junior IT Staff

#### Step 1: Receive Employee Data from HR
- [ ] Obtain completed CSV file from HR with all employee details
- [ ] Validate data format and completeness
- [ ] Identify any missing or incorrect information
- [ ] Coordinate with HR to resolve data issues

#### Step 2: Create User Accounts (Batch Processing)

**For Small Teams (<50 employees):**
Manual creation via Admin Dashboard:

```
For each employee:
1. Go to Admin Dashboard
2. Click "Create User"
3. Enter email, full name
4. Assign department
5. Assign default "User" role
6. Verify account created
7. Document in tracking spreadsheet
```

**For Large Teams (>50 employees):**
Use bulk import script via edge function:

```typescript
// Call bulk-create-users edge function
const employees = csvData.map(row => ({
  email: row.email,
  full_name: row.full_name,
  department: row.department,
  job_title: row.job_title,
  start_date: row.start_date,
  customer_id: YOUR_CUSTOMER_ID
}));

const response = await supabase.functions.invoke('bulk-create-users', {
  body: { employees }
});
```

#### Step 3: Track Account Creation

Create tracking spreadsheet:
```
Employee Name | Email | Account Created | Profile Created | Role Assigned | Welcome Email Sent | Status | Notes
```

Update after each batch of 10-20 accounts.

#### Step 4: Send Welcome Emails

- [ ] Generate credentials for each new account
- [ ] Send welcome email with:
  - Login URL
  - Username (email)
  - Temporary password (if applicable)
  - First login instructions
  - Support contact information

**Daily Goal:** 15-20 accounts per day

**Deliverable:** All employee accounts created and documented

---

### Days 6-7: Role Assignment

**Time Allocation:** 2 days (4 hours/day)  
**Owner:** IT Admin

#### Step 1: Assign Default "User" Role
All employees should have at least the "User" role:

```sql
-- Verify all users have at least User role
SELECT up.email, up.full_name
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = up.user_id
);
```

If any users are missing roles, add them:
```sql
INSERT INTO user_roles (user_id, role_id)
SELECT up.user_id, r.id
FROM user_profiles up
CROSS JOIN roles r
WHERE r.name = 'User'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur2
  WHERE ur2.user_id = up.user_id
);
```

#### Step 2: Assign Elevated Roles
Work with HR/Security to identify users needing elevated access:

| Role Type | Identification Criteria | Assignment Process |
|-----------|------------------------|-------------------|
| **Admin** | Department heads, IT staff | Via RBAC Portal → Search user → Assign 'Admin' role |
| **Manager** | Team leads, supervisors | Via RBAC Portal → Search user → Assign 'Manager' role |
| **Customer** | External stakeholders | Via RBAC Portal → Search user → Assign 'Customer' role |

#### Step 3: Document Role Assignments
Create role assignment log:
```
Employee Name | Email | Department | Role Assigned | Assigned By | Assignment Date | Justification
```

**Deliverable:** All roles assigned and documented

---

### Days 8-9: Application Access Configuration

**Time Allocation:** 2 days (5 hours/day)  
**Owner:** IT Admin

#### Step 1: Review Application Requirements by Department

| Department | Required Applications | Access Level |
|------------|----------------------|--------------|
| IT | All applications | Admin |
| HR | HRIS, Payroll, Time Tracking | Admin |
| Finance | Accounting, Budgeting, Expense | Admin |
| Sales | CRM, Email, Calendar | User |
| Operations | Project Mgmt, Documentation | User |

#### Step 2: Assign Application Access

**Via Admin Dashboard (`/applications-admin`):**

For each application:
1. Click application name
2. Navigate to "Access Control" tab
3. Select departments or roles with access
4. Set access level (View/Edit/Admin)
5. Save configuration
6. Test with sample user from that department

#### Step 3: Configure Application Launcher
- [ ] Verify App Launcher shows correct apps per role/department
- [ ] Test with different user accounts
- [ ] Adjust display order for user experience
- [ ] Document application access matrix

**Deliverable:** Application access matrix and configuration complete

---

### Days 10-11: Workspace and Hardware Setup

**Time Allocation:** 2 days (8 hours/day)  
**Owner:** IT Admin + IT Support Staff

#### Hardware Assignment Process

**For each new employee:**

1. **Prepare Workstation**
   - [ ] Assign computer from inventory
   - [ ] Install/verify OS and required software
   - [ ] Join computer to domain/Azure AD
   - [ ] Configure security settings (encryption, firewall)
   - [ ] Install antivirus/endpoint protection
   - [ ] Configure VPN client

2. **Setup Peripherals**
   - [ ] Monitor(s) - based on role requirements
   - [ ] Keyboard and mouse
   - [ ] Headset/phone for communication roles
   - [ ] Dock/adapters if needed
   - [ ] Cable management

3. **Configure User Profile**
   - [ ] Create local/domain user account
   - [ ] Map network drives
   - [ ] Configure email client
   - [ ] Install department-specific applications
   - [ ] Set desktop background/corporate branding

4. **Security Configuration**
   - [ ] Enable full disk encryption
   - [ ] Configure automatic screen lock (10 minutes)
   - [ ] Set password complexity requirements
   - [ ] Enable MFA on all compatible systems
   - [ ] Install security monitoring agent

5. **Document Asset Assignment**
   Update CMDB with:
   - Device serial number
   - Assigned user
   - Assignment date
   - Workstation location
   - Peripheral list

**Hardware Checklist per Employee:**
```
☐ Computer (Serial: _______)
☐ Monitor(s) (Serial: _______)
☐ Keyboard
☐ Mouse
☐ Headset
☐ Phone (Extension: _______)
☐ Dock/Adapters
☐ Cables organized
☐ All software installed
☐ Security configured
☐ Asset logged in CMDB
☐ Equipment acknowledgment signed
```

**Daily Goal:** Setup 5-8 workstations per day

**Deliverable:** All workstations prepared and documented

---

### Day 12: System Access Testing

**Time Allocation:** 8 hours  
**Owner:** IT Admin + QA Tester

#### Comprehensive Testing Checklist

**For Sample Users from Each Department:**

1. **Authentication Testing**
   - [ ] User can log in with credentials
   - [ ] Password reset works
   - [ ] Session persists across page refresh
   - [ ] Logout works correctly
   - [ ] Remember me functionality (if applicable)

2. **Dashboard Access Testing**
   - [ ] User sees correct department dashboard
   - [ ] Dashboard loads without errors
   - [ ] Department-specific widgets display
   - [ ] Navigation menu shows appropriate options

3. **Application Access Testing**
   - [ ] App Launcher shows correct applications
   - [ ] Each application opens successfully
   - [ ] Single sign-on works (if configured)
   - [ ] No unauthorized app access

4. **Role Permission Testing**
   - [ ] User can access allowed features
   - [ ] User cannot access restricted features
   - [ ] Admin users have elevated privileges
   - [ ] Manager users can see team data

5. **Data Isolation Testing**
   - [ ] Users only see their department data
   - [ ] RLS policies enforce data segregation
   - [ ] No cross-customer data leakage

**Test with:**
- 1 User role from each department (minimum 5 users)
- 1 Manager role
- 1 Admin role
- 1 Super Admin role

**Testing Documentation Template:**
```
Test Date: _______
Tester: _______
User Tested: _______ (Role: _______)
Department: _______

Test Results:
- Authentication: PASS/FAIL (Notes: _______)
- Dashboard Access: PASS/FAIL (Notes: _______)
- Application Access: PASS/FAIL (Notes: _______)
- Role Permissions: PASS/FAIL (Notes: _______)
- Data Isolation: PASS/FAIL (Notes: _______)

Issues Found:
1. _______
2. _______

Resolution Actions:
1. _______
2. _______
```

**Deliverable:** Testing report with all issues resolved

---

## Post-Implementation Phase (Days 13-15)

### Day 13: Issue Resolution

**Time Allocation:** 8 hours  
**Owner:** IT Admin + Support Team

#### Common Issues and Resolutions

**Issue 1: User Cannot Log In**
```
Diagnosis Steps:
1. Verify account exists in user_profiles table
2. Check if email is confirmed
3. Verify RLS policies aren't blocking access
4. Check for typos in email address
5. Review audit logs for failed attempts

Resolution:
- Reset password via Admin Dashboard
- Manually confirm email if auto-confirm failed
- Re-create account if corrupted
```

**Issue 2: Wrong Permissions**
```
Diagnosis Steps:
1. Query user_roles table for user
2. Verify role assignment is correct
3. Check role_permissions table
4. Test with different user account

Resolution:
- Remove incorrect role assignment
- Add correct role via RBAC Portal
- Clear user's session/cache
- Ask user to log out and back in
```

**Issue 3: Application Not Accessible**
```
Diagnosis Steps:
1. Check application_access table
2. Verify application is_active = true
3. Check user's role has access
4. Review RLS policies

Resolution:
- Add user's role to application_access
- Activate application if disabled
- Verify department assignment
```

**Issue 4: Department Dashboard Not Loading**
```
Diagnosis Steps:
1. Check department field on user_profile
2. Verify department name spelling (case-sensitive)
3. Review browser console for errors
4. Check routing configuration

Resolution:
- Correct department name in database
- Clear browser cache
- Update routing rules if needed
```

#### Support Ticket Tracking

Create support ticket log:
```
Ticket # | Employee | Issue Type | Reported Date | Resolution | Resolved Date | Resolution Time
```

**Target Metrics:**
- 90% of issues resolved within 24 hours
- 100% of critical issues resolved within 4 hours
- Average resolution time < 2 hours

**Deliverable:** All reported issues resolved and documented

---

### Day 14: Final Validation

**Time Allocation:** 6 hours  
**Owner:** IT Manager

#### Validation Queries

**1. Verify All Employees Have Accounts**
```sql
-- This should match HR's employee count
SELECT COUNT(*) as total_accounts
FROM user_profiles
WHERE created_at >= '2025-10-01'; -- Adjust to onboarding start date
```

**2. Verify All Users Have Roles**
```sql
-- Should return 0 rows
SELECT up.email, up.full_name
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = up.user_id
)
AND up.created_at >= '2025-10-01';
```

**3. Verify Department Distribution**
```sql
SELECT department, COUNT(*) as employee_count
FROM user_profiles
GROUP BY department
ORDER BY employee_count DESC;
```

**4. Verify Role Distribution**
```sql
SELECT r.name as role_name, COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON ur.role_id = r.id
GROUP BY r.name
ORDER BY user_count DESC;
```

**5. Check for Failed Logins**
```sql
SELECT user_id, COUNT(*) as failed_attempts
FROM audit_logs
WHERE action_type = 'login_failed'
  AND created_at >= '2025-10-01'
GROUP BY user_id
HAVING COUNT(*) > 5;
```

#### System Health Check
- [ ] Database performance is normal
- [ ] No slow queries detected
- [ ] Backup jobs are running
- [ ] Audit logging is functioning
- [ ] No security alerts triggered

**Deliverable:** Final validation report

---

### Day 15: Documentation and Handoff

**Time Allocation:** 4 hours  
**Owner:** IT Manager

#### Create Final Documentation

**1. IT Onboarding Summary Report**
Include:
- Total accounts created
- Role distribution breakdown
- Application access matrix
- Hardware assignments
- Issues encountered and resolved
- Lessons learned
- Recommendations for next iteration

**2. Employee IT Resource Guide**
Create and distribute:
- System login instructions
- Application access guide
- Password reset procedures
- IT support contact information
- FAQ document
- Troubleshooting tips

**3. Knowledge Base Articles**
Create KB articles for:
- "How to Reset Your Password"
- "How to Access Your Applications"
- "How to Request Additional Access"
- "IT Support Contact Information"
- "Common Login Issues and Solutions"

**4. Handoff to Support Team**
- [ ] Brief support team on common issues
- [ ] Provide access to support documentation
- [ ] Set up ticketing system for ongoing issues
- [ ] Establish escalation procedures
- [ ] Define SLAs for issue resolution

**Deliverable:** Complete documentation package

---

## Ongoing Responsibilities

### Daily Tasks
- [ ] Monitor for new support tickets
- [ ] Review failed login attempts
- [ ] Check system health metrics
- [ ] Respond to access requests

### Weekly Tasks
- [ ] Review user access logs
- [ ] Audit role assignments
- [ ] Process new employee onboarding
- [ ] Update documentation as needed
- [ ] Meet with HR/Security teams

### Monthly Tasks
- [ ] Conduct security access review
- [ ] Audit inactive accounts
- [ ] Review application usage
- [ ] Update hardware inventory
- [ ] Generate onboarding metrics report

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Account Creation Time** | < 10 minutes per user | Time tracking log |
| **First Login Success Rate** | > 95% | Audit logs analysis |
| **Application Access Setup** | 100% by Day 10 | Application access audit |
| **Hardware Deployment** | 100% by start date | Asset tracking system |
| **Support Ticket Volume** | < 5% of users need support | Ticket system |
| **Average Issue Resolution Time** | < 2 hours | Ticket tracking |
| **Employee Satisfaction** | > 4.0/5.0 | Post-onboarding survey |

---

## Tools and Resources

### Required Access
- [ ] Admin access to OberaConnect platform
- [ ] Supabase backend access (via Lovable)
- [ ] RBAC Portal access
- [ ] Application Admin access
- [ ] CMDB access
- [ ] Hardware inventory system

### Required Tools
- [ ] Bulk user creation script/edge function
- [ ] CSV import template
- [ ] Testing checklist
- [ ] Support ticket system
- [ ] Asset management system
- [ ] Documentation repository

### Support Resources
- [ ] IT team contact list
- [ ] Escalation procedures
- [ ] Vendor support contacts
- [ ] Internal documentation
- [ ] Training materials

---

## Appendix: Quick Reference Commands

### Check User Status
```sql
SELECT 
  up.email,
  up.full_name,
  up.department,
  array_agg(r.name) as roles,
  up.created_at
FROM user_profiles up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE up.email = 'employee@company.com'
GROUP BY up.email, up.full_name, up.department, up.created_at;
```

### Assign Role to User
```sql
INSERT INTO user_roles (user_id, role_id)
SELECT up.user_id, r.id
FROM user_profiles up
CROSS JOIN roles r
WHERE up.email = 'manager@company.com'
  AND r.name = 'Admin';
```

### Bulk Update Department
```sql
UPDATE user_profiles
SET department = 'Sales'
WHERE email IN ('user1@company.com', 'user2@company.com');
```

### Find Users Without Roles
```sql
SELECT up.email, up.full_name
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = up.user_id
);
```

---

## Contact Information

**IT Team Lead:** [Name], [Email], [Phone]  
**IT Support:** [support@company.com], [Extension]  
**Escalation:** [IT Manager Name], [Email], [Phone]  
**After Hours:** [On-call number]

---

**Document Owner:** IT Manager  
**Last Updated:** October 2025  
**Next Review:** 30 days post-implementation
