# 🚨 CRITICAL SECURITY: Client User Type Enforcement

**Priority**: CRITICAL - MUST FIX BEFORE CLIENT PORTAL LAUNCH
**Risk Level**: HIGH - Data breach potential
**Status**: NOT IMPLEMENTED
**Blocks**: Phase 0 Client Portal MVP

---

## Problem Statement

**Current State**: The platform does not differentiate between MSP employees and business clients.

**Security Risk**:
- Client users from Dr. Smith's Clinic could potentially query and access data from other clients
- No enforcement of "client users can only see their own org's data"
- RLS policies don't distinguish between employee users (should see all customers) and client users (should see only their customer)

**Business Impact**:
- Cannot safely launch client portals
- Violates B2B2C security model
- HIPAA/compliance violation risk
- Blocks $348K ARR opportunity from Phase 0

---

## Required Database Changes

### 1. Add `is_client_user` Column to `user_profiles`

```sql
-- Add column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN is_client_user BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for performance
CREATE INDEX idx_user_profiles_is_client_user
ON user_profiles(is_client_user);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.is_client_user IS
'TRUE = Business client user (can only see their own customer data). FALSE = Obera MSP employee (can see all customers).';
```

**Migration Notes**:
- Existing users should default to `is_client_user = FALSE` (MSP employees)
- New client users must be created with `is_client_user = TRUE`
- This is a NON-NULL column with a default, so it's a safe migration

---

## Required RLS Policy Updates

### Current Problem

Existing RLS policies likely look like this:

```sql
-- CURRENT (INSUFFICIENT)
CREATE POLICY "Users can access their customer data"
ON some_table
FOR SELECT
USING (customer_id = (
  SELECT customer_id
  FROM user_profiles
  WHERE user_id = auth.uid()
));
```

**Issue**: This allows BOTH MSP employees AND client users to see data where `customer_id` matches. But:
- MSP employees should see ALL customers
- Client users should see ONLY their own customer

---

### Updated RLS Policies

#### Template for All Tables with `customer_id`

```sql
-- ============================================================================
-- RLS POLICY TEMPLATE: Two-Tier Access Control
--
-- Obera MSP Employees: See ALL customers
-- Client Users: See ONLY their own customer
-- ============================================================================

-- Example: compliance_reports table
-- Replace "compliance_reports" with actual table name

-- DROP EXISTING POLICIES FIRST
DROP POLICY IF EXISTS "compliance_reports_select" ON compliance_reports;

-- CREATE NEW TWO-TIER POLICY
CREATE POLICY "compliance_reports_select"
ON compliance_reports
FOR SELECT
USING (
  -- Obera employees: See all customers
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_client_user = FALSE
  )
  OR
  -- Client users: See only their own customer
  (
    customer_id = (
      SELECT customer_id
      FROM user_profiles
      WHERE user_id = auth.uid()
      AND is_client_user = TRUE
    )
  )
);
```

#### Tables Requiring Updated RLS Policies

**CRITICAL - Must update RLS on these tables**:

1. `customer_customizations`
2. `integrations`
3. `workflows`
4. `workflow_executions`
5. `compliance_frameworks`
6. `compliance_controls`
7. `compliance_evidence`
8. `compliance_reports`
9. `evidence_files`
10. `client_tickets`
11. `service_requests`
12. `service_catalog`
13. `applications`
14. `audit_logs`
15. `cipp_tenants`
16. `cipp_tenant_health`
17. `cipp_security_baselines`
18. `cipp_policies`
19. `cipp_audit_logs`
20. `anomaly_detections`
21. `device_metrics`
22. `network_devices`

**Total**: 90+ tables (from CLAUDE.md) - Each table with `customer_id` needs this two-tier policy

---

## Example Implementation for Key Tables

### 1. Client Tickets (Client Portal)

```sql
-- Client tickets: Critical for client portal
DROP POLICY IF EXISTS "client_tickets_select" ON client_tickets;

CREATE POLICY "client_tickets_select"
ON client_tickets
FOR SELECT
USING (
  -- MSP employees: See all tickets
  EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = FALSE
  )
  OR
  -- Client users: See only their own customer's tickets
  (
    customer_id = (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = TRUE
    )
  )
);

-- INSERT: Client users can create tickets for their own customer
DROP POLICY IF EXISTS "client_tickets_insert" ON client_tickets;

CREATE POLICY "client_tickets_insert"
ON client_tickets
FOR INSERT
WITH CHECK (
  -- Must be creating ticket for their own customer
  customer_id = (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- UPDATE/DELETE: Only MSP employees (client users should NOT delete their own tickets)
DROP POLICY IF EXISTS "client_tickets_update" ON client_tickets;

CREATE POLICY "client_tickets_update"
ON client_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = FALSE
  )
);
```

### 2. Compliance Reports (Client Portal)

```sql
-- Compliance reports: Client users need read-only access
DROP POLICY IF EXISTS "compliance_reports_select" ON compliance_reports;

CREATE POLICY "compliance_reports_select"
ON compliance_reports
FOR SELECT
USING (
  -- MSP employees: See all
  EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = FALSE
  )
  OR
  -- Client users: See only their own customer's reports
  (
    customer_id = (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = TRUE
    )
  )
);

-- INSERT/UPDATE/DELETE: MSP employees only
DROP POLICY IF EXISTS "compliance_reports_insert" ON compliance_reports;

CREATE POLICY "compliance_reports_insert"
ON compliance_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = FALSE
  )
);
```

### 3. Customer Customizations (Critical for Branding)

```sql
-- Customer customizations: Client users need to see their own branding
DROP POLICY IF EXISTS "customer_customizations_select" ON customer_customizations;

CREATE POLICY "customer_customizations_select"
ON customer_customizations
FOR SELECT
USING (
  -- MSP employees: See all
  EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = FALSE
  )
  OR
  -- Client users: See only their own
  (
    customer_id = (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = TRUE
    )
  )
);

-- UPDATE/DELETE: MSP employees only
DROP POLICY IF EXISTS "customer_customizations_update" ON customer_customizations;

CREATE POLICY "customer_customizations_update"
ON customer_customizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_client_user = FALSE
  )
);
```

---

## Application Code Changes

### 1. User Creation/Signup

When creating new users, set the `is_client_user` flag appropriately:

```typescript
// In user signup/creation logic
interface CreateUserParams {
  email: string;
  customer_id: string;
  department: string;
  is_client_user: boolean; // NEW: Must be specified
}

// MSP Employee
await supabase.from('user_profiles').insert({
  user_id: user.id,
  email: user.email,
  customer_id: 'obera-customer-id',
  department: 'it',
  is_client_user: false // MSP employee
});

// Client User (e.g., from Dr. Smith's Clinic)
await supabase.from('user_profiles').insert({
  user_id: user.id,
  email: 'office@drsmithclinic.com',
  customer_id: 'dr-smith-clinic-id',
  department: 'admin', // Client admin
  is_client_user: true // CLIENT USER - restricted access
});
```

### 2. Client Portal Access Check

Add access control to client portal:

```typescript
// src/pages/ClientPortal.tsx

useEffect(() => {
  const checkClientPortalAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_client_user, customer_id')
      .eq('user_id', user.id)
      .single();

    // Client portal is FOR client users
    // But also allow MSP employees for testing/support
    if (!profile) {
      toast.error('No user profile found');
      navigate('/portal');
      return;
    }

    // Optional: Redirect MSP employees to admin portal
    if (!profile.is_client_user) {
      console.warn('MSP employee accessing client portal (allowed for support)');
    }
  };

  checkClientPortalAccess();
}, []);
```

### 3. Admin Dashboard Access Control

Restrict admin features from client users:

```typescript
// src/pages/AdminDashboard.tsx

useEffect(() => {
  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_client_user, department')
      .eq('user_id', user.id)
      .single();

    // Admin dashboard is ONLY for MSP employees
    if (profile?.is_client_user) {
      toast.error('Access denied: Admin portal is for MSP staff only');
      navigate('/client-portal');
      return;
    }

    // Also check department role
    if (profile?.department !== 'admin') {
      toast.error('Admin access required');
      navigate('/portal');
      return;
    }
  };

  checkAdminAccess();
}, []);
```

---

## Testing Strategy

### Penetration Testing Scenarios

**Test 1: Client User Cannot See Other Clients' Data**

```typescript
// As Dr. Smith's Clinic user
const { data, error } = await supabase
  .from('client_tickets')
  .select('*')
  .eq('customer_id', 'OTHER_CLIENT_ID'); // Try to access another client

// Expected: Returns EMPTY (RLS blocks it)
// If returns data: CRITICAL SECURITY BUG
```

**Test 2: Client User Can Only Create Tickets for Their Own Customer**

```typescript
// As Dr. Smith's Clinic user
const { data, error } = await supabase
  .from('client_tickets')
  .insert({
    customer_id: 'OTHER_CLIENT_ID', // Try to create for another client
    subject: 'Test',
    description: 'Test'
  });

// Expected: ERROR (RLS blocks it)
// If succeeds: CRITICAL SECURITY BUG
```

**Test 3: MSP Employee Can See All Clients**

```typescript
// As Obera MSP employee
const { data, error } = await supabase
  .from('client_tickets')
  .select('*');

// Expected: Returns tickets from ALL customers
// If returns only one customer: BUG
```

**Test 4: Client User Cannot Access Admin Features**

```typescript
// As Dr. Smith's Clinic user, try to access:
// - /admin
// - /compliance (MSP compliance dashboard)
// - /cipp (MSP-only CIPP management)
// - /workflows (MSP workflow automation)

// Expected: Redirect to /client-portal or Access Denied
// If allowed: CRITICAL SECURITY BUG
```

### Automated Test Suite

Create test cases in `/test/comprehensive` dashboard:

```typescript
// Test suite for is_client_user enforcement
const securityTests = [
  {
    name: "Client user isolation",
    test: async () => {
      // Login as client user
      // Attempt to access other client data
      // Verify RLS blocks it
    }
  },
  {
    name: "MSP employee full access",
    test: async () => {
      // Login as MSP employee
      // Verify can see all customers
    }
  },
  {
    name: "Client portal access control",
    test: async () => {
      // Verify client users can access /client-portal
      // Verify MSP employees cannot access /client-portal (or warned)
    }
  }
];
```

---

## Rollout Plan

### Phase 1: Database Migration (1 day)

1. Add `is_client_user` column to `user_profiles`
2. Set all existing users to `is_client_user = FALSE` (MSP employees)
3. Verify migration successful

### Phase 2: RLS Policy Updates (2-3 days)

1. Update RLS policies on 20+ critical tables
2. Test each policy with client user and MSP employee
3. Document all policy changes

### Phase 3: Application Updates (2 days)

1. Update user creation/signup logic
2. Add access control checks to admin pages
3. Add access control checks to client portal
4. Update all queries to respect is_client_user flag

### Phase 4: Testing (3 days)

1. Create test client users
2. Run penetration tests
3. Verify data isolation
4. Fix any bugs found
5. Third-party security audit (recommended)

### Phase 5: Pilot Launch (1 week)

1. Create client users for 3 pilot clients
2. Monitor access logs closely
3. Verify no cross-client data access
4. Gather feedback

**Total Timeline: 2-3 weeks**

---

## Success Criteria

✅ **Database Migration**:
- `is_client_user` column added to `user_profiles`
- All existing users set to `FALSE` (MSP employees)
- Index created for performance

✅ **RLS Policies**:
- All 90+ tables with `customer_id` have two-tier RLS policies
- Policies tested with both client users and MSP employees
- Policies documented

✅ **Application Code**:
- User creation sets `is_client_user` correctly
- Admin pages block client users
- Client portal accessible to client users
- MSP employees retain full access

✅ **Security Testing**:
- Client user cannot see other clients' data (verified via penetration test)
- Client user cannot create data for other customers
- MSP employee can see all customers
- No RLS policy bypasses found

✅ **Production Readiness**:
- Third-party security audit passed
- Pilot clients successfully using portals
- No data leakage incidents
- Audit logging shows all client access

---

## Audit Logging

Log all client user access for compliance:

```typescript
// In useAuditLog hook, enhance to track client access
await supabase.from('audit_logs').insert({
  customer_id: profile.customer_id,
  action_type: 'client_portal_access',
  action_description: `Client user ${profile.email} accessed portal`,
  performed_by: user.id,
  is_client_user: profile.is_client_user, // NEW: Track user type
  details: {
    page: window.location.pathname,
    timestamp: new Date().toISOString()
  }
});
```

---

## References

- **CLAUDE.md**: Security principles (lines 32-45)
- **OBERACONNECT_BUSINESS_MODEL_AND_STRATEGY.md**: B2B2C security model
- **user_profiles schema**: src/integrations/supabase/types.ts (needs `is_client_user` column)

---

## Next Steps

1. ⚠️ **IMMEDIATE**: Present this document to Obera leadership
2. ⚠️ **URGENT**: Request database migration from Lovable Cloud team
3. ⚠️ **CRITICAL**: Do NOT launch client portals until this is implemented
4. 📋 Assign developer to implement RLS policy updates
5. 📋 Schedule security audit/penetration testing
6. 📋 Create test client users for validation

---

**Document Status**: ✅ Complete
**Owner**: OberaConnect Security Team
**Last Updated**: 2025-11-09
**Classification**: CONFIDENTIAL - Internal Security Documentation
