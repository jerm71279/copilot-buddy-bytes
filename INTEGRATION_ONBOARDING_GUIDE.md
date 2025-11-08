# Integration Onboarding Guide

## Overview

This guide provides a standardized, step-by-step process for onboarding any new integration (SaaS, on-prem server, network device, API-based service) into the OberaConnect MSP platform.

---

## 1. System Type & Connection Review

### Initial Assessment Checklist

- [ ] **Identify system type:**
  - SaaS (e.g., billing, security platform, CRM)
  - On-premises server (e.g., AD, file server, database)
  - Network device (e.g., firewall, switch, access point)
  - API-based service (e.g., monitoring, ticketing)

- [ ] **Assess integration method:**
  - REST API
  - GraphQL
  - Webhook
  - PowerShell/CLI
  - SNMP
  - Syslog
  - Direct Database Connection

- [ ] **Verify authentication scheme:**
  - OAuth 2.0 / OAuth 1.0
  - API Key / Token
  - Service Account
  - On-prem credential (username/password)
  - Platform app registration (Azure AD, etc.)

- [ ] **Review API documentation:**
  - Core CRUD operations available
  - Event/webhook support
  - Rate limits and throttling
  - Data format (JSON, XML, etc.)
  - Required headers and authentication

- [ ] **Confirm security requirements:**
  - Credential vaulting method
  - Least privilege roles/scopes
  - Audit logging requirements
  - Data encryption (in transit/at rest)
  - Compliance requirements (HIPAA, SOC2, etc.)

---

## 2. Integration Template Onboarding Process

### A. Registration & Configuration

**Objective:** Register the new system in the platform and securely store credentials.

#### Steps:

1. **Register in Integration Registry**
   - Add entry to `integrations` table or configuration management system
   - Document integration metadata:
     - Integration name
     - System type
     - Vendor information
     - API version
     - Connection endpoints

2. **Store Credentials Securely**
   - Use Lovable Cloud secrets management
   - Store API keys, tokens, or service account credentials
   - Document credential rotation schedule
   - Set up credential expiration alerts

3. **Document Connection Details**
   - Base URL / endpoint
   - Required scopes/permissions
   - Test credentials for sandbox/dev environment
   - Production credentials (when ready)

**Responsible:** Integration Lead, Security Team

---

### B. Edge Function or Connector Creation

**Objective:** Develop serverless function to handle communication with the new system.

#### Development Standards:

```typescript
// Template: supabase/functions/{integration-name}/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Input validation
    const requestData = await req.json();
    
    // Validate required fields
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get credentials from secure vault
    const apiKey = Deno.env.get('INTEGRATION_API_KEY');
    if (!apiKey) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'Integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Make API call to external system
    const response = await fetch('https://api.external-system.com/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      console.error('External API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'External system error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // 4. Log the operation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('integration_logs').insert({
      integration_name: 'integration-name',
      operation: requestData.operation || 'unknown',
      status: 'success',
      request_data: requestData,
      response_data: data,
    });

    // 5. Return response
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Key Requirements:

- **Input Validation:** Validate all incoming data (type, length, format)
- **Security:** Use `.maybeSingle()` for DB queries, never `.single()`
- **Error Handling:** Comprehensive try-catch with detailed logging
- **Audit Logging:** Log all operations to `integration_logs` table
- **CORS:** Always include CORS headers for web app access
- **Rate Limiting:** Implement retry logic with exponential backoff

**Responsible:** Backend Developer, Integration Lead

---

### C. Workflow Mapping

**Objective:** Configure workflows to leverage the new integration.

#### Workflow Design Considerations:

1. **Trigger Types:**
   - **Webhook:** Real-time events from external system
   - **Scheduled:** Periodic sync/polling (cron-based)
   - **Event-based:** React to internal platform events
   - **Manual:** User-initiated actions

2. **Action Steps:**
   - Sync assets/data
   - Create/update tickets
   - Send notifications
   - Update CMDB/inventory
   - Trigger downstream workflows
   - Generate reports

3. **Output Steps:**
   - Update dashboards
   - Send audit logs
   - Notify users/teams (email, Slack, Teams)
   - Update status indicators

4. **Error Handling:**
   - Define retry logic
   - Escalation paths for failures
   - Fallback actions

#### Example Workflow Template:

```json
{
  "workflow_name": "Sync Assets from External System",
  "workflow_type": "scheduled",
  "trigger": {
    "type": "cron",
    "schedule": "0 */6 * * *"
  },
  "steps": [
    {
      "step_number": 1,
      "action_type": "edge_function",
      "action_config": {
        "function_name": "external-system-sync",
        "parameters": {
          "sync_type": "assets",
          "customer_id": "{{customer_id}}"
        }
      }
    },
    {
      "step_number": 2,
      "action_type": "database_update",
      "action_config": {
        "table": "assets",
        "operation": "upsert"
      }
    },
    {
      "step_number": 3,
      "action_type": "notification",
      "action_config": {
        "type": "email",
        "recipients": ["admin@company.com"],
        "template": "asset_sync_complete"
      }
    }
  ]
}
```

**Responsible:** Workflow Designer, Integration Lead

---

### D. Dashboard and Monitoring

**Objective:** Provide visibility into integration health and activity.

#### Dashboard Components:

1. **Integration Status Widget**
   - Connection status (connected/disconnected)
   - Last successful sync timestamp
   - Error count (last 24h)
   - API rate limit usage

2. **Activity Timeline**
   - Recent operations
   - Success/failure indicators
   - Data volumes transferred

3. **Alert Configuration**
   - Connection failures
   - Authentication errors
   - Rate limit warnings
   - Data anomalies

#### Health Check Implementation:

```typescript
// Add to edge function or create separate health check function
export async function checkIntegrationHealth(integrationName: string) {
  try {
    // Attempt simple API call
    const response = await fetch('https://api.external-system.com/health');
    
    return {
      status: response.ok ? 'healthy' : 'degraded',
      latency: response.headers.get('x-response-time'),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Responsible:** Frontend Developer, DevOps

---

### E. Testing & Validation

**Objective:** Ensure integration works correctly before production deployment.

#### Test Phases:

1. **Credential Test**
   - Verify authentication works
   - Test token refresh (if applicable)
   - Confirm scopes/permissions are correct

2. **Data Fetch Sample**
   - Retrieve sample data
   - Validate data format
   - Test pagination (if applicable)

3. **Workflow Dry Run**
   - Execute workflow without destructive actions
   - Use test/sandbox environment
   - Verify all steps complete successfully

4. **Audit Log Review**
   - Confirm operations are logged correctly
   - Verify sensitive data is masked
   - Check log retention policies

5. **Error Scenario Testing**
   - Invalid credentials
   - Network timeout
   - Rate limit exceeded
   - Invalid data format
   - Concurrent requests

#### Test Checklist:

- [ ] Authentication successful
- [ ] Data retrieval works
- [ ] Data format validated
- [ ] Error handling works correctly
- [ ] Logging captures all operations
- [ ] Dashboard displays integration status
- [ ] Alerts trigger appropriately
- [ ] Workflow executes end-to-end
- [ ] No sensitive data exposed in logs
- [ ] Performance meets requirements

**Responsible:** QA, Integration Lead

---

### F. Ongoing Maintenance

**Objective:** Keep integration healthy and up-to-date.

#### Maintenance Tasks:

1. **Credential Rotation**
   - Schedule: Quarterly (or per security policy)
   - Update secrets in vault
   - Test new credentials before rotating
   - Document rotation in audit log

2. **API Version Updates**
   - Monitor vendor release notes
   - Test new API versions in sandbox
   - Update edge function code as needed
   - Update documentation

3. **Performance Monitoring**
   - Track API latency trends
   - Monitor rate limit usage
   - Review error rates
   - Optimize queries if needed

4. **User Feedback**
   - Collect feedback from internal users
   - Track feature requests
   - Prioritize improvements
   - Document known issues

**Responsible:** DevOps, Integration Lead

---

## 3. Integration Onboarding Checklist

| Step | Description | Responsible | Status | Notes |
|------|-------------|-------------|--------|-------|
| **Phase 1: Discovery** |
| 1.1 | System Type Review | Integration Lead | ⏳ | API/OOBC/SNMP/DB/etc. |
| 1.2 | Authentication Method | Integration Lead | ⏳ | OAuth/API Key/etc. |
| 1.3 | API Documentation Review | Integration Lead | ⏳ | Endpoints, rate limits |
| 1.4 | Security Requirements | Security Team | ⏳ | Scopes, compliance |
| **Phase 2: Setup** |
| 2.1 | Credential Setup | Security Team | ⏳ | Vault credentials |
| 2.2 | Registry Entry | Integration Lead | ⏳ | Add to integrations DB |
| 2.3 | Sandbox Environment | DevOps | ⏳ | Test credentials |
| **Phase 3: Development** |
| 3.1 | Edge Function Dev | Backend Developer | ⏳ | Build connector |
| 3.2 | Input Validation | Backend Developer | ⏳ | Security checks |
| 3.3 | Error Handling | Backend Developer | ⏳ | Retry logic |
| 3.4 | Audit Logging | Backend Developer | ⏳ | Log all operations |
| **Phase 4: Workflow** |
| 4.1 | Workflow Mapping | Workflow Designer | ⏳ | Define triggers/actions |
| 4.2 | Trigger Configuration | Workflow Designer | ⏳ | Webhook/schedule |
| 4.3 | Action Steps | Workflow Designer | ⏳ | Define operations |
| 4.4 | Notification Setup | Workflow Designer | ⏳ | Alerts/emails |
| **Phase 5: UI/UX** |
| 5.1 | Dashboard Extension | Frontend Developer | ⏳ | Add status widgets |
| 5.2 | Monitoring Setup | DevOps | ⏳ | Health checks |
| 5.3 | Alert Configuration | DevOps | ⏳ | Failure alerts |
| **Phase 6: Testing** |
| 6.1 | Credential Test | QA | ⏳ | Auth verification |
| 6.2 | Data Fetch Test | QA | ⏳ | Sample data retrieval |
| 6.3 | Workflow Dry Run | QA | ⏳ | End-to-end test |
| 6.4 | Error Scenario Test | QA | ⏳ | Failure handling |
| 6.5 | Log Review | QA | ⏳ | Audit trail |
| **Phase 7: Documentation** |
| 7.1 | Technical Documentation | Technical Writer | ⏳ | API specs, code |
| 7.2 | User Documentation | Technical Writer | ⏳ | How-to guides |
| 7.3 | Runbook Creation | DevOps | ⏳ | Troubleshooting |
| **Phase 8: Approval** |
| 8.1 | Security Review | Security Team | ⏳ | Vulnerability check |
| 8.2 | Stakeholder Approval | Project Manager | ⏳ | Sign-off |
| 8.3 | Production Deployment | DevOps | ⏳ | Go-live |
| **Phase 9: Post-Launch** |
| 9.1 | Monitoring Active | DevOps | ⏳ | 24/7 monitoring |
| 9.2 | User Training | Training Team | ⏳ | Internal training |
| 9.3 | Feedback Collection | Product Manager | ⏳ | User feedback |

---

## 4. Database Schema for Integration Tracking

### Table: `integration_registry`

```sql
CREATE TABLE integration_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  system_type TEXT NOT NULL, -- 'saas', 'on-prem', 'network', 'api'
  vendor_name TEXT NOT NULL,
  connection_method TEXT NOT NULL, -- 'rest_api', 'graphql', 'webhook', etc.
  auth_method TEXT NOT NULL, -- 'oauth', 'api_key', 'service_account', etc.
  base_url TEXT,
  api_version TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'development', 'testing', 'active', 'deprecated'
  health_status TEXT DEFAULT 'unknown', -- 'healthy', 'degraded', 'unhealthy', 'unknown'
  last_health_check TIMESTAMP WITH TIME ZONE,
  credential_vault_path TEXT,
  credential_rotation_schedule TEXT,
  last_credential_rotation TIMESTAMP WITH TIME ZONE,
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  documentation_url TEXT,
  edge_function_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);
```

### Table: `integration_onboarding_checklist`

```sql
CREATE TABLE integration_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_registry(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'discovery', 'setup', 'development', etc.
  step_number TEXT NOT NULL,
  step_description TEXT NOT NULL,
  responsible_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
  assigned_to UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `integration_logs`

```sql
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'warning'
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  customer_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_name);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
```

---

## 5. Common Integration Patterns

### Pattern 1: Sync Data from External System

**Use Case:** Periodically fetch data from external system and store locally.

**Workflow:**
1. Scheduled trigger (cron) fires
2. Edge function calls external API
3. Transform data to local schema
4. Upsert into local database
5. Log operation
6. Update dashboard

### Pattern 2: Webhook Receiver

**Use Case:** External system sends real-time events.

**Workflow:**
1. External system POST to webhook URL
2. Edge function validates webhook signature
3. Process event data
4. Trigger internal workflow
5. Send acknowledgment to external system
6. Log event

### Pattern 3: On-Demand Action

**Use Case:** User initiates action that requires external system.

**Workflow:**
1. User clicks button in UI
2. Frontend calls edge function
3. Edge function performs action in external system
4. Return result to user
5. Update UI
6. Log operation

---

## 6. Troubleshooting Guide

### Common Issues:

| Issue | Possible Cause | Resolution |
|-------|---------------|------------|
| Authentication failure | Expired credentials | Rotate credentials in vault |
| Rate limit exceeded | Too many requests | Implement exponential backoff |
| Timeout errors | Slow external API | Increase timeout, add retries |
| Data format mismatch | API version changed | Update transformation logic |
| Connection refused | Firewall/network issue | Check network rules, VPN |

---

## 7. Security Best Practices

1. **Credential Management:**
   - Never hardcode credentials
   - Use Lovable Cloud secrets management
   - Rotate credentials regularly
   - Use least privilege principle

2. **Input Validation:**
   - Validate all incoming data
   - Sanitize user inputs
   - Check data types and lengths
   - Prevent injection attacks

3. **API Security:**
   - Use HTTPS only
   - Validate webhook signatures
   - Implement rate limiting
   - Log all access attempts

4. **Data Protection:**
   - Encrypt sensitive data at rest
   - Mask sensitive data in logs
   - Follow data retention policies
   - Implement access controls

---

## 8. Next Steps

After completing this onboarding process:

1. **Monitor Performance:**
   - Track API latency
   - Monitor error rates
   - Review logs regularly

2. **Gather Feedback:**
   - Survey users
   - Track feature requests
   - Document pain points

3. **Iterate and Improve:**
   - Optimize slow operations
   - Add requested features
   - Update documentation

4. **Plan for Scale:**
   - Review rate limits
   - Consider caching strategies
   - Plan for failover

---

## 9. Resources

- [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)
- [Edge Function Best Practices](https://docs.lovable.dev/)
- [API Security Guidelines](consolidated_INTEGRATIONS.md)
- [Workflow Design Patterns](SYSTEM_ARCHITECTURE_DIAGRAM.md)

---

## Contact

For questions or support:
- **Integration Team:** integrations@oberaconnect.com
- **Security Team:** security@oberaconnect.com
- **DevOps:** devops@oberaconnect.com
