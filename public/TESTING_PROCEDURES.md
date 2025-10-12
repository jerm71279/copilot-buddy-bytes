# OberaConnect Platform - Complete Testing Procedures

## Testing Environment Setup
- Test Customer Account: Create dedicated test customer
- Test Users: Create users with different roles (Admin, User, Department-specific)
- Test Data: Populate with realistic sample data

---

## Phase 1: Two-Tier Feedback Loop Testing

### 1.1 Department AI Assistant (Phase 1)
**Location:** `/intelligent-assistant`

**Test Cases:**
- [ ] Submit queries from different departments (IT, HR, Sales, Finance)
- [ ] Verify responses are department-specific
- [ ] Check that insights are generated and stored in `departmental_insights` table
- [ ] Validate insight categories: knowledge_gap, process_inefficiency, contradiction
- [ ] Verify confidence scores are calculated (0-100)
- [ ] Test that queries reference knowledge base articles when available
- [ ] Check compliance tagging on responses

**Expected Results:**
- Responses tailored to department context
- Insights automatically generated after interactions
- High confidence scores for clear patterns
- Knowledge base integration working

**SQL Validation:**
```sql
-- Check insights were created
SELECT * FROM departmental_insights 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Verify department distribution
SELECT department, COUNT(*) as insight_count 
FROM departmental_insights 
GROUP BY department;
```

---

### 1.2 Department Insights Page (Phase 2)
**Location:** `/department-insights`

**Test Cases:**
- [ ] View insights for each department
- [ ] Filter by department, category, confidence score
- [ ] Sort by date, confidence, frequency
- [ ] View insight details including evidence and impact
- [ ] Check statistics display correctly
- [ ] Verify department filter works
- [ ] Test search functionality

**Expected Results:**
- All generated insights visible
- Filters and sorting work correctly
- Statistics accurate
- Evidence links working

---

### 1.3 Central MML Engine (Phase 3)
**Location:** `/global-insights`

**Test Cases:**
- [ ] Run MML Processor manually
- [ ] Verify cross-department patterns identified
- [ ] Check global insights created in `global_insights` table
- [ ] Validate insight correlations in `insight_correlations` table
- [ ] Review recommended actions
- [ ] Check confidence scores on global insights
- [ ] Verify affected departments array is correct

**Expected Results:**
- Global insights synthesize departmental data
- Cross-department patterns detected (e.g., IT knowledge gaps affecting HR)
- Correlations created between related insights
- Actionable recommendations generated

**SQL Validation:**
```sql
-- Check global insights
SELECT * FROM global_insights 
ORDER BY created_at DESC;

-- Check correlations
SELECT 
  gi.title as global_insight,
  di.insight_summary as dept_insight,
  ic.correlation_strength,
  ic.correlation_type
FROM insight_correlations ic
JOIN global_insights gi ON gi.id = ic.global_insight_id
JOIN departmental_insights di ON di.id = ic.departmental_insight_id;
```

---

### 1.4 Feedback Distribution (Phase 4)
**Location:** `/department-feedback`

**Test Cases:**
- [ ] View feedback items distributed to departments
- [ ] Filter by department
- [ ] Check statistics (total, pending, acknowledged, applied)
- [ ] Acknowledge feedback items
- [ ] Apply feedback with implementation notes
- [ ] Verify feedback status updates
- [ ] Test that applied feedback affects AI assistant responses

**Expected Results:**
- Feedback items visible by department
- Status transitions work (pending → acknowledged → applied)
- Statistics update in real-time
- AI assistants incorporate feedback into responses

**Integration Test:**
- [ ] Generate departmental insight (Phase 1)
- [ ] View in insights page (Phase 2)
- [ ] Run MML processor to create global insight (Phase 3)
- [ ] Check feedback distributed to relevant departments (Phase 4)
- [ ] Verify AI assistant uses feedback in next interaction (Phase 1)

---

## Phase 2: Core Platform Features

### 2.1 Authentication & Authorization
**Location:** `/auth`

**Test Cases:**
- [ ] Sign up with email/password
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Session persistence (refresh page)
- [ ] Password reset flow
- [ ] Role-based access control (RBAC)
- [ ] View own profile
- [ ] Update profile information

**Security Tests:**
- [ ] Cannot access admin pages as regular user
- [ ] Cannot view other customers' data
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized

---

### 2.2 CMDB & Configuration Management
**Location:** `/cmdb-dashboard`

**Test Cases:**
- [ ] View all configuration items
- [ ] Filter by type, status, criticality
- [ ] Search by name, serial, asset tag
- [ ] Add new CI
- [ ] Edit existing CI
- [ ] Delete CI (soft delete)
- [ ] View CI details with relationships
- [ ] View audit log for CI changes
- [ ] Check health score calculation
- [ ] View pending changes for CI

**NinjaOne Integration:**
- [ ] Sync devices from NinjaOne
- [ ] Verify device data matches NinjaOne
- [ ] Check ninjaone_device_id populated
- [ ] Test bidirectional sync (update in NinjaOne → syncs to CMDB)

---

### 2.3 Change Management
**Location:** `/change-management`

**Test Cases:**
- [ ] Create new change request
- [ ] Submit for approval
- [ ] Approve/reject as approver
- [ ] Schedule approved change
- [ ] Implement change
- [ ] Complete change with notes
- [ ] View change calendar
- [ ] Check impact analysis runs automatically
- [ ] Verify risk scoring
- [ ] Test emergency change workflow

**Impact Analysis Validation:**
```sql
-- Check impact analysis was created
SELECT 
  cr.change_number,
  cr.title,
  cia.business_impact_score,
  cia.technical_impact_score,
  cia.security_impact_score,
  cia.success_probability
FROM change_requests cr
LEFT JOIN change_impact_analysis cia ON cia.change_request_id = cr.id
WHERE cr.created_at > NOW() - INTERVAL '1 hour';
```

---

### 2.4 Compliance Management
**Location:** `/compliance-portal`

**Test Cases:**
- [ ] View compliance frameworks (SOC2, HIPAA, ISO27001, GDPR)
- [ ] View controls for each framework
- [ ] Update control status
- [ ] Upload evidence for controls
- [ ] View evidence library
- [ ] Generate compliance reports
- [ ] Schedule audits
- [ ] View audit history
- [ ] Check compliance score calculation

---

### 2.5 Workflow Automation
**Location:** `/workflow-automation`

**Test Cases:**
- [ ] View existing workflows
- [ ] Create new workflow
- [ ] Edit workflow steps
- [ ] Test workflow execution
- [ ] View execution history
- [ ] Check workflow triggers (manual, scheduled, event-based)
- [ ] Verify workflow evidence collection
- [ ] Test workflow orchestration (multi-step)

**Workflow Intelligence:**
- [ ] AI suggests workflow optimizations
- [ ] Identifies repetitive tasks
- [ ] Recommends automation opportunities

---

### 2.6 Knowledge Base
**Location:** `/knowledge-base`

**Test Cases:**
- [ ] View all articles
- [ ] Search articles
- [ ] Filter by category, tags
- [ ] Create new article
- [ ] Edit article (versioning)
- [ ] Delete article
- [ ] View article history
- [ ] Upload documents
- [ ] AI processes uploaded documents
- [ ] AI answers questions from knowledge base

---

### 2.7 Incident Management
**Location:** `/incidents-dashboard`

**Test Cases:**
- [ ] Create new incident
- [ ] Assign to technician
- [ ] Update incident status
- [ ] Add incident notes
- [ ] Upload evidence
- [ ] Link to CI
- [ ] Close incident
- [ ] View incident history
- [ ] Generate incident reports

---

### 2.8 Network Monitoring
**Location:** `/network-monitoring`

**Test Cases:**
- [ ] View network devices
- [ ] Check device status (up/down)
- [ ] View SNMP metrics
- [ ] View syslog events
- [ ] Create alerts
- [ ] Test alert triggers
- [ ] View device health scores
- [ ] Historical data visualization

---

### 2.9 Client Portal
**Location:** `/client-portal`

**Test Cases:**
- [ ] Client can view their data only
- [ ] Create support ticket
- [ ] View ticket status
- [ ] Update ticket
- [ ] View invoices
- [ ] View service agreements
- [ ] Cannot access other clients' data

---

## Phase 3: Integration Testing

### 3.1 Microsoft 365 Integration
**Location:** `/microsoft365-integration`

**⚠️ KNOWN ISSUES:**
- Access token persistence needs fixing
- Token refresh mechanism incomplete

**Test Cases:**
- [ ] Connect M365 account
- [ ] View calendar events
- [ ] View emails
- [ ] View OneDrive files
- [ ] View Teams messages
- [ ] Check token expiration handling
- [ ] Test token refresh (currently broken)

---

### 3.2 CIPP Integration
**Location:** `/cipp-dashboard`

**Test Cases:**
- [ ] View managed tenants
- [ ] Sync tenant data
- [ ] View tenant health scores
- [ ] Apply security policies
- [ ] View audit logs
- [ ] Generate security reports

---

### 3.3 Revio Integration
**Note:** Currently using placeholder data until OneBill migration completes

**Test Cases:**
- [ ] Verify placeholder data displays correctly
- [ ] Check customer accounts load
- [ ] Validate invoice data structure
- [ ] Test subscription information
- [ ] Prepare for live API cutover

---

### 3.4 NinjaOne Integration
**Test Cases:**
- [ ] Sync devices from NinjaOne
- [ ] Create tickets in NinjaOne from CMDB
- [ ] View ticket status in NinjaOne
- [ ] Bidirectional updates work
- [ ] Webhook handling

---

## Phase 4: Security Testing

### 4.1 Row-Level Security (RLS) Policies
**Test All Tables:**
- [ ] Users can only see data for their customer
- [ ] Admins can see all data for their customer
- [ ] Super admins can see all data
- [ ] Users cannot access other customers' data
- [ ] Test CRUD operations respect RLS

**SQL Test Script:**
```sql
-- Run as regular user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = '<test_user_id>';

-- Should only return this user's customer data
SELECT * FROM configuration_items;
SELECT * FROM change_requests;
SELECT * FROM compliance_controls;
```

---

### 4.2 Edge Function Security
**Test Each Edge Function:**
- [ ] Requires authentication where appropriate
- [ ] Validates input data
- [ ] Sanitizes user input
- [ ] Handles errors gracefully
- [ ] Logs security events
- [ ] Rate limiting works (if implemented)

---

### 4.3 Input Validation
**Test Forms:**
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload validation (type, size)
- [ ] Email validation
- [ ] Phone number validation
- [ ] URL validation

---

### 4.4 Audit Logging
**Test Cases:**
- [ ] All sensitive operations logged
- [ ] Logs include user, timestamp, action
- [ ] Logs are immutable (cannot delete)
- [ ] Logs viewable by admins only
- [ ] Compliance tags applied correctly

---

## Phase 5: Performance Testing

### 5.1 Page Load Times
**Target: < 2 seconds for initial load**

**Test Pages:**
- [ ] Dashboard loads quickly
- [ ] CMDB with 1000+ items
- [ ] Change requests with 500+ items
- [ ] Compliance controls with all frameworks
- [ ] Knowledge base with 100+ articles
- [ ] Network monitoring real-time data

---

### 5.2 Database Query Performance
**Check Slow Queries:**
```sql
-- Enable slow query logging
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 20;
```

**Optimization:**
- [ ] Add indexes where needed
- [ ] Optimize complex joins
- [ ] Use materialized views for reports

---

### 5.3 Edge Function Performance
**Test Response Times:**
- [ ] AI assistant < 3 seconds (streaming)
- [ ] MML processor < 10 seconds
- [ ] Change impact analyzer < 5 seconds
- [ ] Workflow executor < 2 seconds

---

## Phase 6: User Acceptance Testing (UAT)

### 6.1 End-to-End Scenarios

**Scenario 1: New Employee Onboarding**
1. HR creates employee record
2. IT provisions accounts (RBAC)
3. Workflow automation triggers
4. Equipment assigned in CMDB
5. Compliance training scheduled
6. Manager receives notification

**Scenario 2: Change Management**
1. Technician creates change request
2. Impact analysis runs automatically
3. Approvers receive notifications
4. Change approved
5. Change scheduled
6. Change implemented
7. Evidence collected
8. Change closed with documentation

**Scenario 3: Compliance Audit**
1. Auditor requests SOC2 compliance report
2. System generates report with all evidence
3. Missing controls identified
4. Remediation workflows created
5. Evidence uploaded
6. Controls marked complete
7. Final report generated

**Scenario 4: AI-Driven Insights**
1. Multiple departments use AI assistant
2. Patterns identified (knowledge gaps, inefficiencies)
3. MML processor generates global insights
4. Feedback distributed to departments
5. AI assistants incorporate feedback
6. Processes improved across organization

---

## Testing Checklist Summary

### Critical Path (Must Pass)
- [ ] Authentication & RBAC
- [ ] RLS policies prevent data leaks
- [ ] Two-tier feedback loop (all 4 phases)
- [ ] CMDB core functionality
- [ ] Change management workflow
- [ ] Compliance evidence upload

### High Priority
- [ ] Network monitoring
- [ ] Knowledge base AI integration
- [ ] Workflow automation
- [ ] Incident management
- [ ] NinjaOne integration

### Medium Priority
- [ ] Microsoft 365 integration (fix token persistence first)
- [ ] CIPP integration
- [ ] Client portal
- [ ] Sales portal
- [ ] Analytics dashboards

### Low Priority (Polish)
- [ ] Custom report builder
- [ ] Advanced visualizations
- [ ] Mobile responsiveness
- [ ] Revio live API (when available)

---

## Reporting Test Results

### Create Test Report:
```markdown
## Test Report - [Date]

### Environment
- Tester: [Name]
- Customer ID: [UUID]
- User Role: [Admin/User]
- Browser: [Chrome/Firefox/Safari]

### Tests Executed
- Total: X
- Passed: X
- Failed: X
- Blocked: X

### Critical Issues Found
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual result
   - Screenshots/Logs

### Recommendations
- [List of recommendations]
```

---

## Next Steps After Testing

1. **Fix Critical Issues** - Block deployment if any critical issues found
2. **Document Known Issues** - Create issue tracking for medium/low priority
3. **Update User Documentation** - Based on UAT feedback
4. **Security Review** - Run security scan one more time
5. **Performance Optimization** - Address any performance bottlenecks
6. **Prepare Production Deployment** - If all critical tests pass

---

## Automated Testing Setup (Future)

Consider implementing:
- Unit tests for components
- Integration tests for workflows
- E2E tests with Playwright/Cypress
- Performance regression tests
- Security scanning in CI/CD
