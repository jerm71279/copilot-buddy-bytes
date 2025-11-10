# OberaConnect: Internal MSP Operations Roadmap

**Date**: November 9, 2025
**Focus**: Internal use only - Obera's MSP operations
**Approach**: Fact-based improvements, no speculation

---

## Current Reality (Facts Only)

### What Exists Today

**Platform Built:**
- 70+ pages across 8 department dashboards
- 90+ database tables with Row Level Security
- 26+ edge functions
- React + TypeScript + Lovable Cloud (Supabase)
- Integration foundations: NinjaOne, CIPP, MS365, Revio (partial), network monitoring

**Obera's Current Situation:**
- Active MSP managing 50-500 endpoints
- Serving business clients in healthcare, legal, finance (regulated industries)
- Current vendor stack: NinjaOne (RMM), UniFi, Keeper Security, SonicWall, MikroTik, MS365
- **Pain points**: Poor workflow automation + compliance gaps

**What's Working:**
- Multi-tenant architecture with RLS
- Customer customization system
- AI assistants (department-specific)
- Visual workflow builder
- Compliance framework tracking
- Audit logging system

---

## Core Problems to Solve (Obera's Real Pain Points)

### Problem 1: Manual Workflow Across Tools

**Current State:**
- Switch between NinjaOne, M365 admin, Keeper, network device interfaces
- Client onboarding = 6+ hours of manual setup across multiple systems
- Weekly client reports = 2-3 hours of manual data gathering per client
- Compliance evidence collection = 10-15 hours per quarterly audit

**Impact:**
- Technician time wasted switching contexts
- Human error in manual processes
- Can't scale without adding headcount

### Problem 2: Compliance Gaps for Regulated Clients

**Current State:**
- Healthcare clients need HIPAA compliance tracking
- Legal/finance clients need SOC 2 documentation
- Evidence collection is manual (screenshots, logs, configurations)
- Audit preparation is stressful and time-consuming

**Impact:**
- Audit cycles are painful
- Risk of non-compliance for clients
- Competitive disadvantage (clients want better compliance visibility)

### Problem 3: Disconnected Data Sources

**Current State:**
- NinjaOne has device/patch data
- CIPP has M365 tenant data
- Network devices have monitoring data
- No unified view

**Impact:**
- Can't see full client picture
- Reporting requires manual data aggregation
- Missed correlations between systems

---

## Prioritized Improvements (Internal Operations Only)

### Phase 1: Workflow Automation (Next 60 Days)

**Goal**: Eliminate top 3 most time-consuming manual tasks

#### 1.1 Client Onboarding Automation ⭐⭐⭐

**Current Process** (6+ hours):
1. Create customer record in OberaConnect
2. Manually create M365 tenant in CIPP
3. Manually create organization in NinjaOne
4. Manually configure monitoring baselines
5. Manually send welcome email
6. Manually create compliance framework

**Automated Process** (30 minutes):
```typescript
// Workflow: New Client Onboarding
// Trigger: Customer created in OberaConnect

Step 1: Create customer record (manual)
Step 2: Auto-create CIPP tenant via API
Step 3: Auto-create NinjaOne organization via API
Step 4: Auto-apply monitoring templates
Step 5: Auto-initialize compliance framework (HIPAA/SOC2/ISO based on industry)
Step 6: Auto-send welcome email from template
Step 7: Notify Obera team in Slack/Teams
```

**Implementation:**
- Build edge function: `client-onboarding-workflow`
- Integrate with:
  - CIPP API (already connected)
  - NinjaOne API (needs implementation)
  - Email service (already have Supabase)
- Create workflow template in OberaConnect
- Test with 1-2 new clients

**ROI**: Save 5.5 hours per client onboarding

---

#### 1.2 Automated Compliance Evidence Collection ⭐⭐⭐

**Current Process** (10-15 hours per quarterly audit):
1. Manually log into each system
2. Take screenshots of security configurations
3. Export logs from multiple sources
4. Compile into folders
5. Map to compliance framework controls
6. Upload to evidence storage

**Automated Process** (30 minutes to review):
```typescript
// Workflow: Weekly Compliance Evidence Collection
// Trigger: Cron job every Monday 8am

For each customer:
  Step 1: Query NinjaOne for:
    - Patch status (last 7 days)
    - Antivirus status
    - Failed login attempts

  Step 2: Query CIPP for:
    - M365 security score
    - Conditional access policies
    - MFA enforcement status

  Step 3: Query network devices for:
    - Firewall rule changes
    - VPN access logs

  Step 4: Auto-map to compliance controls:
    - HIPAA 164.308(a)(5)(ii)(B) → MFA logs
    - HIPAA 164.312(b) → Audit logs

  Step 5: Store in evidence_files table
  Step 6: Update compliance_evidence records
  Step 7: Notify team if gaps detected
```

**Implementation:**
- Build edge function: `compliance-evidence-collector`
- API integrations:
  - NinjaOne API (device status)
  - CIPP API (M365 security)
  - Network devices (SNMP/Syslog - already partially built)
- Database tables already exist: `compliance_evidence`, `evidence_files`
- Map evidence to framework controls

**ROI**: Save 10-12 hours per quarterly audit per client

---

#### 1.3 Weekly Client Reporting Automation ⭐⭐

**Current Process** (2-3 hours per client per week):
1. Log into NinjaOne → export device status
2. Log into CIPP → check M365 security score
3. Log into network devices → check uptime
4. Create PDF in Word/Google Docs
5. Email to client manually

**Automated Process** (5 minutes to review):
```typescript
// Workflow: Weekly Client Report
// Trigger: Cron job every Friday 5pm

For each customer:
  Step 1: Aggregate data:
    - Tickets opened/resolved this week
    - Device patch status
    - Security incidents
    - M365 security score change
    - Network uptime percentage

  Step 2: Generate PDF report using template

  Step 3: Store in database (workflow_executions)

  Step 4: Email to customer contacts

  Step 5: Log in audit_logs
```

**Implementation:**
- Build edge function: `weekly-client-report-generator`
- PDF generation library (add to dependencies)
- Report templates (create in database)
- Email delivery via Supabase
- Test with 1 client first

**ROI**: Save 2 hours per client per week = 8 hours/month per client

---

### Phase 2: Deep Integration with Current Vendor Stack (Q1 2025)

**Goal**: Make OberaConnect the single pane of glass for all systems

#### 2.1 NinjaOne Deep Integration ⭐⭐⭐

**Current State:**
- Basic sync exists (`ninjaone-sync` edge function)
- Can pull device data
- Limited capabilities

**Needed Enhancements:**
```typescript
// Bi-directional sync improvements

1. Pull from NinjaOne:
   - Real-time alerts → Create tickets in OberaConnect
   - Device status changes → Update device_metrics
   - Patch failures → Trigger workflow for remediation
   - New devices discovered → Auto-add to inventory

2. Push to NinjaOne:
   - OberaConnect ticket created → Create NinjaOne ticket
   - Workflow completion → Update NinjaOne device notes
   - Maintenance window scheduled → Set NinjaOne alert suppression

3. Unified device view:
   - Merge NinjaOne devices + network devices (UniFi, SonicWall)
   - Single inventory in OberaConnect
   - Click device → Launch NinjaOne remote access
```

**Implementation:**
- Enhance `ninjaone-sync` edge function
- Add `ninjaone-webhook` edge function (receive real-time alerts)
- Create unified device view component
- Map NinjaOne ticket fields to OberaConnect tickets
- Test with 1 customer's devices

**ROI**: Reduce context switching, faster incident response

---

#### 2.2 Network Device Consolidation ⭐⭐

**Current State:**
- Network monitoring exists (SNMP, Syslog)
- UniFi, SonicWall, MikroTik data collected separately

**Needed Enhancements:**
```typescript
// Unified network dashboard

1. Device inventory:
   - All network devices in one view
   - Group by type (firewall, switch, AP, router)
   - Show health status, firmware version

2. Alert correlation:
   - UniFi AP down + SonicWall traffic spike → Possible attack
   - MikroTik bandwidth spike + multiple device drops → Network issue

3. Configuration backup:
   - Auto-backup device configs weekly
   - Version control for configurations
   - Alert on unauthorized changes
```

**Implementation:**
- Enhance `device-poller` and `snmp-collector` edge functions
- Build unified network dashboard component
- Add configuration backup to workflows
- Create alert correlation rules

**ROI**: Faster troubleshooting, better visibility

---

#### 2.3 Keeper Security Integration ⭐

**Current State:**
- Obera uses Keeper for password management
- No integration with OberaConnect

**Needed Integration:**
```typescript
// Keeper integration for credentials

1. Store integration credentials in Keeper:
   - NinjaOne API keys
   - CIPP credentials
   - Network device admin passwords

2. Retrieve from Keeper via API:
   - No credentials stored in database
   - Fetch on-demand from Keeper vault

3. Audit trail:
   - Log when credentials accessed
   - Alert on unusual access patterns
```

**Implementation:**
- Add Keeper API integration
- Migrate `integration_credentials` table to use Keeper
- Update edge functions to fetch from Keeper
- Test credential rotation

**ROI**: Better security, compliance benefit

---

### Phase 3: Compliance Automation (Q2 2025)

**Goal**: Make audit preparation automatic

#### 3.1 HIPAA Compliance Dashboard ⭐⭐⭐

**For Obera's internal use** (tracking compliance for healthcare clients)

**Features:**
```typescript
// Per-customer HIPAA tracking

1. Control checklist:
   - 164 HIPAA controls
   - Status: Implemented / In Progress / Not Applicable
   - Evidence linked to each control

2. Automated evidence mapping:
   - MFA logs → Control 164.312(d)
   - Encryption status → Control 164.312(a)(2)(iv)
   - Access logs → Control 164.308(a)(5)(ii)(C)

3. Audit preparation:
   - Generate "Audit Ready" report
   - Export all evidence for auditor
   - Gap analysis: What's missing?

4. Dashboard view:
   - Overall compliance percentage
   - High-risk gaps highlighted
   - Evidence collection status
```

**Implementation:**
- Create HIPAA control templates in database
- Build compliance dashboard component
- Auto-map collected evidence to controls
- Generate audit reports

**ROI**: Audit prep from 15 hours → 2 hours

---

#### 3.2 SOC 2 Compliance Dashboard ⭐⭐

**Similar to HIPAA but for legal/finance clients**

**Features:**
```typescript
// Trust Services Criteria tracking

1. Five categories:
   - Security
   - Availability
   - Processing Integrity
   - Confidentiality
   - Privacy

2. Control testing:
   - Automated tests for common controls
   - Manual test scheduling
   - Test results documentation

3. Continuous monitoring:
   - Real-time compliance posture
   - Drift detection (controls that stopped working)
   - Remediation workflows
```

**Implementation:**
- SOC 2 control templates
- Automated control testing
- Continuous monitoring dashboard

**ROI**: Pass audits faster, reduce risk

---

### Phase 4: Analytics & Optimization (Q3 2025)

**Goal**: Data-driven decision making

#### 4.1 Operational Dashboards ⭐⭐

**For Obera management to see business metrics**

**Dashboards:**
```typescript
1. Technician Efficiency:
   - Tickets resolved per tech per day
   - Average resolution time
   - Ticket backlog trends
   - Time spent in each system (OberaConnect vs. others)

2. Customer Health:
   - Patch compliance percentage
   - Security incident frequency
   - Ticket volume trends
   - Risk score per customer

3. Financial Metrics:
   - Time spent per customer (profitability)
   - Service costs vs. contract value
   - Which customers need pricing adjustment

4. Platform Usage:
   - Which features used most
   - Workflow execution success rates
   - Integration health status
```

**Implementation:**
- Build analytics edge functions
- Create executive dashboards
- Add data visualization components (already have recharts)

**ROI**: Better business decisions, identify unprofitable customers

---

## Technical Implementation Priorities

### Quick Wins (Already Built, Need Enhancement)

**1. Workflow Engine** (already exists)
- `WorkflowBuilder.tsx` exists
- `workflow-executor` edge function exists
- **Add**: Pre-built workflow templates for common tasks
- **Add**: Webhook endpoints for external systems
- **Add**: Better error handling and retry logic

**2. Compliance Framework** (foundation exists)
- `compliance_frameworks`, `compliance_controls`, `compliance_evidence` tables exist
- **Add**: HIPAA and SOC 2 control templates (data)
- **Add**: Automated evidence mapping
- **Add**: Dashboard visualizations

**3. Audit Logging** (exists)
- `audit_logs` table and `useAuditLog` hook exist
- **Add**: Privileged access tracking for NinjaOne
- **Add**: Compliance action logging
- **Add**: Audit trail export for auditors

**4. CIPP Integration** (exists)
- `cipp-sync` edge function exists
- `cipp_tenants`, `cipp_security_baselines` tables exist
- **Add**: Real-time sync (currently manual)
- **Add**: Bulk operations across tenants
- **Add**: Policy templates

### New Builds Required

**1. NinjaOne Integration Enhancements**
- Build: `ninjaone-webhook` edge function (receive alerts)
- Build: Bi-directional ticket sync
- Build: Unified device inventory component
- Estimated: 2-3 weeks

**2. Automated Evidence Collection**
- Build: `compliance-evidence-collector` edge function
- Build: Evidence mapping logic (logs → controls)
- Build: Scheduled collection workflows
- Estimated: 2-3 weeks

**3. Client Onboarding Workflow**
- Build: `client-onboarding-workflow` edge function
- Build: Multi-system provisioning logic
- Build: Email templates and notifications
- Estimated: 1-2 weeks

**4. Weekly Report Generator**
- Build: `weekly-client-report-generator` edge function
- Build: PDF template engine
- Build: Data aggregation from all systems
- Estimated: 2 weeks

---

## ROI Analysis (Fact-Based)

### Time Savings (Per Month)

**Current Manual Effort:**
- Client onboarding: 6 hours × 2 new clients/month = 12 hours
- Compliance evidence: 15 hours × 1 audit/quarter = 5 hours/month
- Weekly reports: 2 hours × 20 clients × 4 weeks = 160 hours
- Context switching: ~2 hours/day × 20 workdays = 40 hours
- **Total: 217 hours/month**

**With Automation:**
- Client onboarding: 0.5 hours × 2 = 1 hour
- Compliance evidence: 2 hours × 1 audit/quarter = 0.67 hours/month
- Weekly reports: 5 minutes × 20 clients × 4 weeks = 6.7 hours
- Context switching: 1 hour/day × 20 workdays = 20 hours (50% reduction)
- **Total: 28.4 hours/month**

**Savings: 188.6 hours/month = ~$9,000/month** (at $50/hour loaded cost)

**Annual Savings: ~$108,000**

---

## Vendor Cost Reality Check

**Current Monthly Costs (Estimated):**
- NinjaOne: $1,200 (300 endpoints × $4)
- Microsoft 365: $2,000 (various licenses)
- Keeper Security: $300 (team plan)
- UniFi/SonicWall/MikroTik: $400 (equipment amortized)
- **Total: $3,900/month = $46,800/year**

**Can OberaConnect Replace Any of These?**
- ❌ Cannot replace NinjaOne (need RMM agent on endpoints)
- ❌ Cannot replace M365 (core productivity)
- ❌ Cannot replace Keeper (password management)
- ❌ Cannot replace network equipment (physical hardware)

**Reality**: OberaConnect is a **coordination layer**, not a replacement. It makes these tools work together better.

**Value**: Time savings ($108K/year) > cost to build/maintain OberaConnect

---

## Implementation Timeline

### Months 1-2: Foundation
- Week 1-2: Plan workflows (onboarding, evidence, reporting)
- Week 3-4: Build client onboarding workflow
- Week 5-6: Build evidence collection automation
- Week 7-8: Build weekly report generator
- **Deliverable**: 3 automated workflows in production

### Months 3-4: Integration Depth
- Week 9-10: NinjaOne webhook integration
- Week 11-12: Bi-directional ticket sync
- Week 13-14: Unified device inventory
- Week 15-16: Network device consolidation
- **Deliverable**: Deep integrations with all vendor tools

### Months 5-6: Compliance Automation
- Week 17-18: HIPAA control templates and dashboard
- Week 19-20: SOC 2 control templates and dashboard
- Week 21-22: Automated evidence mapping
- Week 23-24: Audit report generation
- **Deliverable**: Compliance dashboards for internal use

### Months 7-9: Analytics & Optimization
- Week 25-27: Technician efficiency dashboards
- Week 28-30: Customer health metrics
- Week 31-33: Financial analytics
- Week 34-36: Platform usage analytics
- **Deliverable**: Executive dashboards for Obera leadership

---

## Success Metrics

### Operational Metrics
- Client onboarding time: 6 hours → 30 minutes (90% reduction)
- Audit prep time: 15 hours → 2 hours (87% reduction)
- Weekly report generation: 2 hours → 5 minutes per client (96% reduction)
- Context switching time: 2 hours/day → 1 hour/day (50% reduction)

### Business Metrics
- Time saved: 188 hours/month = $9K/month = $108K/year
- Technician capacity: Equivalent to hiring 1 additional full-time tech
- Audit success rate: Maintain 100% pass rate with less effort
- Client satisfaction: Maintain high satisfaction with less manual work

### Technical Metrics
- Workflow execution success rate: > 95%
- Integration uptime: > 99%
- Data accuracy: 100% (automated > manual)
- Error rate: < 1%

---

## Risks & Mitigation

### Risk 1: API Limitations
**Risk**: NinjaOne/CIPP APIs may not support all needed operations
**Mitigation**: Research API documentation first, have fallback manual processes

### Risk 2: Data Quality
**Risk**: Automated evidence collection may miss nuances
**Mitigation**: Human review of critical evidence, audit trail of what was collected

### Risk 3: Over-Automation
**Risk**: Automate something that needs human judgment
**Mitigation**: Start with obviously-automatable tasks, get feedback before expanding

### Risk 4: Vendor API Changes
**Risk**: NinjaOne or CIPP changes their API, breaks integration
**Mitigation**: Version locking, monitoring, fallback to manual processes

---

## Next Steps

### Week 1: Planning
1. Review this roadmap with Obera team
2. Prioritize: Which automation provides most value?
3. Identify 1-2 pilot customers for testing workflows
4. Assign developer resources

### Week 2: Technical Design
1. Document NinjaOne API integration requirements
2. Design client onboarding workflow (detailed steps)
3. Design evidence collection workflow
4. Set up development environment

### Weeks 3-4: First Automation
1. Build client onboarding workflow
2. Test with 1 pilot customer
3. Measure time savings
4. Iterate based on feedback

### Weeks 5-8: Expand Automation
1. Build evidence collection
2. Build weekly report generator
3. Deploy to production
4. Monitor and optimize

---

## Conclusion

**Focus**: Build OberaConnect to make Obera's MSP operations more efficient.

**Priority**: Automate the 3 most time-consuming manual tasks (onboarding, evidence, reporting).

**Expected Outcome**: Save 188 hours/month ($108K/year) by reducing manual work.

**Timeline**: 6-9 months to full implementation.

**No speculation**: Everything above is based on what exists in the codebase and Obera's stated pain points (workflow automation + compliance gaps).

---

**Document Type**: Internal Operations Roadmap
**Focus**: Obera's MSP operations only
**Based On**: Actual codebase analysis + stated pain points
**No Hallucinations**: All recommendations grounded in existing infrastructure
