# Integration Onboarding Implementation Plan

## Overview

This document outlines the implementation plan for the Integration Onboarding framework in OberaConnect. The framework will provide a structured UI and backend system for managing the entire lifecycle of integration onboarding.

---

## Phase 1: Database Schema Implementation

### Tables to Create:

1. **integration_registry** - Core registry of all integrations
2. **integration_onboarding_checklist** - Tracks onboarding progress
3. **integration_logs** - Audit trail of all integration operations
4. **integration_health_checks** - Historical health check data

### Migration Script:

```sql
-- Integration Registry
CREATE TABLE integration_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  system_type TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  connection_method TEXT NOT NULL,
  auth_method TEXT NOT NULL,
  base_url TEXT,
  api_version TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  health_status TEXT DEFAULT 'unknown',
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
  created_by UUID,
  notes TEXT
);

-- Onboarding Checklist
CREATE TABLE integration_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_registry(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  step_number TEXT NOT NULL,
  step_description TEXT NOT NULL,
  responsible_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Logs
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  customer_id UUID,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Checks
CREATE TABLE integration_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_registry(id) ON DELETE CASCADE,
  health_status TEXT NOT NULL,
  latency_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_name);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
CREATE INDEX idx_integration_health_checks_integration ON integration_health_checks(integration_id);
CREATE INDEX idx_integration_health_checks_checked_at ON integration_health_checks(checked_at DESC);

-- RLS Policies
ALTER TABLE integration_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_checks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view integrations
CREATE POLICY "Users can view integrations" ON integration_registry
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage integrations
CREATE POLICY "Admins can manage integrations" ON integration_registry
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view checklist" ON integration_onboarding_checklist
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update checklist" ON integration_onboarding_checklist
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view logs" ON integration_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view health checks" ON integration_health_checks
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Phase 2: Backend Services

### Edge Functions to Create:

1. **integration-health-check** - Performs health checks on integrations
2. **integration-onboarding** - Manages onboarding workflow
3. **integration-template-generator** - Generates code templates for new integrations

### Service Layer:

Create `src/services/integrationOnboardingService.ts`:

```typescript
import { supabase } from "@/integrations/supabase/client";
import { BaseService, ServiceResponse } from "./baseService";

export interface Integration {
  id: string;
  integration_name: string;
  system_type: string;
  vendor_name: string;
  connection_method: string;
  auth_method: string;
  status: string;
  health_status: string;
  created_at: string;
}

export interface OnboardingChecklistItem {
  id: string;
  integration_id: string;
  phase: string;
  step_number: string;
  step_description: string;
  responsible_role: string;
  status: string;
  assigned_to?: string;
  completed_at?: string;
  notes?: string;
}

export class IntegrationOnboardingService extends BaseService {
  // Get all integrations
  static async getIntegrations(): Promise<ServiceResponse<Integration[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .select('*')
        .order('created_at', { ascending: false });
    });
  }

  // Get integration by ID
  static async getIntegration(id: string): Promise<ServiceResponse<Integration>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    });
  }

  // Create new integration
  static async createIntegration(data: Partial<Integration>): Promise<ServiceResponse<Integration>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_registry')
        .insert(data)
        .select()
        .maybeSingle();
    });
  }

  // Get onboarding checklist
  static async getOnboardingChecklist(integrationId: string): Promise<ServiceResponse<OnboardingChecklistItem[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_onboarding_checklist')
        .select('*')
        .eq('integration_id', integrationId)
        .order('phase', { ascending: true })
        .order('step_number', { ascending: true });
    });
  }

  // Update checklist item
  static async updateChecklistItem(
    id: string,
    updates: Partial<OnboardingChecklistItem>
  ): Promise<ServiceResponse<OnboardingChecklistItem>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_onboarding_checklist')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
    });
  }

  // Initialize checklist for new integration
  static async initializeChecklist(integrationId: string): Promise<ServiceResponse<OnboardingChecklistItem[]>> {
    const checklistTemplate = [
      // Phase 1: Discovery
      { phase: 'discovery', step_number: '1.1', step_description: 'System Type Review', responsible_role: 'Integration Lead' },
      { phase: 'discovery', step_number: '1.2', step_description: 'Authentication Method', responsible_role: 'Integration Lead' },
      { phase: 'discovery', step_number: '1.3', step_description: 'API Documentation Review', responsible_role: 'Integration Lead' },
      { phase: 'discovery', step_number: '1.4', step_description: 'Security Requirements', responsible_role: 'Security Team' },
      
      // Phase 2: Setup
      { phase: 'setup', step_number: '2.1', step_description: 'Credential Setup', responsible_role: 'Security Team' },
      { phase: 'setup', step_number: '2.2', step_description: 'Registry Entry', responsible_role: 'Integration Lead' },
      { phase: 'setup', step_number: '2.3', step_description: 'Sandbox Environment', responsible_role: 'DevOps' },
      
      // Phase 3: Development
      { phase: 'development', step_number: '3.1', step_description: 'Edge Function Development', responsible_role: 'Backend Developer' },
      { phase: 'development', step_number: '3.2', step_description: 'Input Validation', responsible_role: 'Backend Developer' },
      { phase: 'development', step_number: '3.3', step_description: 'Error Handling', responsible_role: 'Backend Developer' },
      { phase: 'development', step_number: '3.4', step_description: 'Audit Logging', responsible_role: 'Backend Developer' },
      
      // Phase 4: Workflow
      { phase: 'workflow', step_number: '4.1', step_description: 'Workflow Mapping', responsible_role: 'Workflow Designer' },
      { phase: 'workflow', step_number: '4.2', step_description: 'Trigger Configuration', responsible_role: 'Workflow Designer' },
      { phase: 'workflow', step_number: '4.3', step_description: 'Action Steps', responsible_role: 'Workflow Designer' },
      { phase: 'workflow', step_number: '4.4', step_description: 'Notification Setup', responsible_role: 'Workflow Designer' },
      
      // Phase 5: UI/UX
      { phase: 'ui_ux', step_number: '5.1', step_description: 'Dashboard Extension', responsible_role: 'Frontend Developer' },
      { phase: 'ui_ux', step_number: '5.2', step_description: 'Monitoring Setup', responsible_role: 'DevOps' },
      { phase: 'ui_ux', step_number: '5.3', step_description: 'Alert Configuration', responsible_role: 'DevOps' },
      
      // Phase 6: Testing
      { phase: 'testing', step_number: '6.1', step_description: 'Credential Test', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.2', step_description: 'Data Fetch Test', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.3', step_description: 'Workflow Dry Run', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.4', step_description: 'Error Scenario Test', responsible_role: 'QA' },
      { phase: 'testing', step_number: '6.5', step_description: 'Log Review', responsible_role: 'QA' },
      
      // Phase 7: Documentation
      { phase: 'documentation', step_number: '7.1', step_description: 'Technical Documentation', responsible_role: 'Technical Writer' },
      { phase: 'documentation', step_number: '7.2', step_description: 'User Documentation', responsible_role: 'Technical Writer' },
      { phase: 'documentation', step_number: '7.3', step_description: 'Runbook Creation', responsible_role: 'DevOps' },
      
      // Phase 8: Approval
      { phase: 'approval', step_number: '8.1', step_description: 'Security Review', responsible_role: 'Security Team' },
      { phase: 'approval', step_number: '8.2', step_description: 'Stakeholder Approval', responsible_role: 'Project Manager' },
      { phase: 'approval', step_number: '8.3', step_description: 'Production Deployment', responsible_role: 'DevOps' },
      
      // Phase 9: Post-Launch
      { phase: 'post_launch', step_number: '9.1', step_description: 'Monitoring Active', responsible_role: 'DevOps' },
      { phase: 'post_launch', step_number: '9.2', step_description: 'User Training', responsible_role: 'Training Team' },
      { phase: 'post_launch', step_number: '9.3', step_description: 'Feedback Collection', responsible_role: 'Product Manager' },
    ];

    const checklistItems = checklistTemplate.map(item => ({
      integration_id: integrationId,
      ...item,
      status: 'pending',
    }));

    return this.executeQuery(async () => {
      return await supabase
        .from('integration_onboarding_checklist')
        .insert(checklistItems)
        .select();
    });
  }

  // Get integration logs
  static async getIntegrationLogs(
    integrationName: string,
    limit: number = 100
  ): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_logs')
        .select('*')
        .eq('integration_name', integrationName)
        .order('created_at', { ascending: false })
        .limit(limit);
    });
  }

  // Get health check history
  static async getHealthCheckHistory(
    integrationId: string,
    limit: number = 100
  ): Promise<ServiceResponse<any[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('integration_health_checks')
        .select('*')
        .eq('integration_id', integrationId)
        .order('checked_at', { ascending: false })
        .limit(limit);
    });
  }
}
```

---

## Phase 3: Frontend Components

### Components to Create:

1. **IntegrationOnboardingDashboard** - Main dashboard showing all integrations
2. **IntegrationOnboardingWizard** - Step-by-step wizard for new integrations
3. **OnboardingChecklistView** - Detailed checklist view
4. **IntegrationHealthMonitor** - Real-time health monitoring
5. **IntegrationLogsViewer** - Log viewer component

### File Structure:

```
src/
  pages/
    IntegrationOnboarding.tsx         # Main page
    IntegrationOnboardingDetail.tsx   # Detail view for single integration
  components/
    integration-onboarding/
      IntegrationCard.tsx              # Card for integration list
      OnboardingProgress.tsx           # Progress indicator
      ChecklistTable.tsx               # Checklist table
      HealthStatusBadge.tsx            # Health status indicator
      IntegrationWizard.tsx            # Multi-step wizard
      CodeTemplateGenerator.tsx        # Template generator
  hooks/
    useIntegrationOnboarding.ts       # Main hook
  services/
    integrationOnboardingService.ts   # Service layer (created above)
```

---

## Phase 4: Implementation Priority

### High Priority (Implement First):

1. ✅ Documentation (INTEGRATION_ONBOARDING_GUIDE.md)
2. ⏳ Database schema and migration
3. ⏳ Service layer (integrationOnboardingService.ts)
4. ⏳ Basic UI (IntegrationOnboarding page)
5. ⏳ Checklist functionality

### Medium Priority:

6. Health check monitoring
7. Log viewer
8. Template generator
9. Integration wizard

### Low Priority:

10. Advanced analytics
11. Automated testing of integrations
12. Integration marketplace

---

## Phase 5: Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Database | Create tables, RLS policies | 2-3 hours |
| Phase 2: Backend | Service layer, edge functions | 4-6 hours |
| Phase 3: Frontend | UI components, pages | 6-8 hours |
| Phase 4: Testing | End-to-end testing | 3-4 hours |
| Phase 5: Documentation | User guides, API docs | 2-3 hours |

**Total Estimated Time:** 17-24 hours

---

## Phase 6: Success Metrics

### Key Performance Indicators:

1. **Onboarding Time:** Average time to complete full integration onboarding
2. **Integration Health:** % of integrations in "healthy" status
3. **Error Rate:** % of integration operations that fail
4. **User Adoption:** # of integrations onboarded per month
5. **Documentation Quality:** User feedback on documentation

---

## Next Steps

1. **Review and Approve** this implementation plan
2. **Create Database Migration** for Phase 1
3. **Implement Service Layer** for Phase 2
4. **Build UI Components** for Phase 3
5. **Test and Iterate** based on feedback

---

## Questions for Review

1. Should we add integration templates for common systems (e.g., Microsoft 365, Salesforce)?
2. Do we need role-based access control for integration management?
3. Should health checks run automatically on a schedule?
4. Do we want email notifications for integration failures?
5. Should we support integration versioning (v1, v2, etc.)?
