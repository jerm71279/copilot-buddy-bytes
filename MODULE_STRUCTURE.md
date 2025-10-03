# OberaConnect Module Structure

## 🧩 Overview

OberaConnect follows a modular architecture where each subsystem is independently testable, replaceable, and documented. This document details the organization, dependencies, and responsibilities of each module.

## 📦 Module Categories

### 1. Authentication Module
**Location**: `src/pages/Auth.tsx`, `src/integrations/supabase/client.ts`

**Responsibilities**:
- User signup and login
- Session management
- Password reset flows
- Email verification (auto-confirmed in dev)

**Key Functions**:
```typescript
// Signup flow
const handleSignup = async (email, password, fullName, department) => {
  // 1. Create auth user
  const { data: authData } = await supabase.auth.signUp({ email, password });
  
  // 2. Create customer record (if new)
  // 3. Create user_profile with department
  // 4. Create customer_customizations with defaults
  // 5. Redirect to department dashboard
};

// Login flow
const handleLogin = async (email, password) => {
  const { data } = await supabase.auth.signInWithPassword({ email, password });
  // Redirect based on user's department
};
```

**Dependencies**:
- Supabase Auth service
- Database tables: `customers`, `user_profiles`, `customer_customizations`

**Testing**:
- Manual: Create account, login, logout, verify department routing
- Database: Check that all three tables receive records on signup

---

### 2. Customization Module
**Location**: `src/hooks/useCustomerCustomization.tsx`

**Responsibilities**:
- Load customer-specific branding (logo, colors)
- Apply CSS variables for theming
- Manage enabled features and integrations
- Handle dashboard layout preferences

**Key Functions**:
```typescript
export const useCustomerCustomization = (customerId?: string) => {
  // 1. Fetch customization from database
  // 2. Apply CSS variables to document root
  // 3. Return customization object and loading state
};

const applyCustomization = (customization: CustomerCustomization) => {
  const root = document.documentElement;
  root.style.setProperty('--primary', customization.primary_color);
  root.style.setProperty('--secondary', customization.secondary_color);
  root.style.setProperty('--accent', customization.accent_color);
};
```

**Dependencies**:
- Database table: `customer_customizations`
- CSS design tokens in `src/index.css`

**Usage Example**:
```typescript
// In a dashboard component
const { customization, isLoading } = useCustomerCustomization(customerId);

// Automatically applies branding
// Components use design tokens (bg-primary, text-accent) which reflect customization
```

**Testing**:
- Create multiple customers with different color schemes
- Verify CSS variables update on customer login
- Check that enabled_integrations filters UI correctly

---

### 3. Dashboard Module
**Location**: `src/pages/*Dashboard.tsx`

**Responsibilities**:
- Department-specific data display
- Role-based access control
- Stats cards and data visualization
- AI assistant integration per department

**Sub-modules**:

#### AdminDashboard
- **Purpose**: Customer management and system overview
- **Data**: All customers, integration status, MCP servers
- **Unique Features**: Customer table with filtering, system-wide health

#### ComplianceDashboard
- **Purpose**: Framework tracking, controls, evidence management
- **Data**: Compliance frameworks, controls count, evidence files
- **Unique Features**: Framework coverage progress bars

#### ITDashboard
- **Purpose**: System integrations, server health, anomaly detection
- **Data**: Integration status, MCP servers, security anomalies
- **Unique Features**: Real-time integration health monitoring

#### OperationsDashboard
- **Purpose**: Workflow efficiency, ML insights, bottleneck identification
- **Data**: Workflow counts, ML insights, efficiency metrics
- **Unique Features**: Workflow efficiency breakdown

#### HRDashboard
- **Purpose**: Employee management, session tracking
- **Data**: Total users, active sessions, department breakdown
- **Unique Features**: Department employee distribution

#### FinanceDashboard
- **Purpose**: Revenue tracking, subscription management
- **Data**: Monthly revenue, customer counts, active subscriptions
- **Unique Features**: Recent customer table with plan/status

#### SalesDashboard
- **Purpose**: Pipeline management, deal tracking, forecasting
- **Data**: Revenue, active deals, conversion rate
- **Unique Features**: Sales pipeline by stage, top opportunities

#### ExecutiveDashboard
- **Purpose**: High-level KPIs, strategic overview
- **Data**: Customer count, compliance score, ML insights, risk alerts
- **Unique Features**: Compliance overview, business metrics aggregation

**Common Pattern**:
```typescript
const [Dashboard]Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkAccess();  // Verify auth + department
  }, []);

  const checkAccess = async () => {
    // 1. Get session
    // 2. Fetch user profile
    // 3. Verify department matches
    // 4. Fetch stats
    // 5. Set loading false
  };

  const fetchStats = async () => {
    // Department-specific data queries
  };

  return (
    // Dashboard UI with stats cards, widgets, AI assistant
  );
};
```

**Dependencies**:
- Database tables vary by dashboard (user_profiles, workflows, integrations, etc.)
- `DepartmentAIAssistant` component
- `MCPServerStatus` component (some dashboards)

**Testing**:
- Login as different departments, verify correct dashboard shows
- Check that RLS policies prevent cross-department data access
- Verify stats display correctly

---

### 4. Integration Module
**Location**: `src/components/Integrations.tsx`, `src/pages/IntegrationsPage.tsx`

**Responsibilities**:
- Display available integrations (public)
- Show integration details (auth, permissions, setup)
- Track integration status per customer

**Integration Categories**:
1. **Billing & Revenue**: Onebill, rev.io
2. **Cloud & Identity**: Azure, Lighthouse, CIPP
3. **Network Security**: SonicWall, UniFi, MikroTik
4. **Security & Access**: Keeper Security, Keeper Connection Manager
5. **RMM & Infrastructure**: NinjaOne
6. **Cybersecurity**: Threatdown, OpenText

**Data Structure**:
```typescript
interface Integration {
  id: string;
  customer_id?: string;  // NULL = system-wide
  system_name: string;
  integration_type: 'billing' | 'cloud' | 'security' | 'rmm' | 'compliance';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  last_sync: string;
}
```

**Components**:
- `Integrations.tsx`: Landing page integration grid
- `IntegrationsPage.tsx`: Detailed integration information
- Dashboard integration status indicators

**Dependencies**:
- Database table: `integrations`
- Icons from lucide-react

**Testing**:
- Verify all integrations display on landing page
- Check detailed info on integrations page
- Test status indicators in dashboards

---

### 5. AI Module
**Location**: `src/components/DepartmentAIAssistant.tsx`, `supabase/functions/department-assistant/`

**Responsibilities**:
- Department-specific AI chat interface
- Context-aware AI responses
- Integration with Lovable AI models

**Frontend Component**:
```typescript
interface DepartmentAIAssistantProps {
  department: string;  // 'compliance', 'it', 'hr', etc.
}

const DepartmentAIAssistant: React.FC<DepartmentAIAssistantProps> = ({ department }) => {
  // Chat interface
  // Sends messages to edge function with department context
  // Displays AI responses
};
```

**Backend Edge Function**:
```typescript
// supabase/functions/department-assistant/index.ts
serve(async (req) => {
  const { department, message, customerId } = await req.json();
  
  // 1. Load department context
  // 2. Route to appropriate AI model
  // 3. Generate response
  // 4. Return to frontend
});
```

**Supported Models**:
- `google/gemini-2.5-pro` - Complex reasoning
- `google/gemini-2.5-flash` - Balanced
- `openai/gpt-5` - High accuracy
- `openai/gpt-5-mini` - Cost-effective

**Dependencies**:
- Lovable AI (no API keys required)
- Department-specific data from database
- Edge function runtime

**Testing**:
- Send messages from each dashboard
- Verify department-specific responses
- Check error handling for network issues

---

### 6. MCP Server Module
**Location**: `src/components/MCPServerStatus.tsx`, `supabase/functions/mcp-server/`

**Responsibilities**:
- Model Context Protocol server registry
- Server health monitoring
- Advanced AI capabilities (tool execution, structured outputs)

**Frontend Component**:
```typescript
const MCPServerStatus = () => {
  // Fetches MCP servers from database
  // Displays health status
  // Shows capabilities
};
```

**Backend Edge Function**:
```typescript
// supabase/functions/mcp-server/index.ts
serve(async (req) => {
  // Handle MCP protocol requests
  // Execute tools on registered servers
  // Return structured responses
});
```

**Database Table**:
```sql
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY,
  name TEXT,
  url TEXT,
  description TEXT,
  capabilities TEXT[],
  status TEXT,  -- 'online', 'offline', 'error'
  last_check TIMESTAMP
);
```

**Dependencies**:
- Database table: `mcp_servers`
- MCP protocol specification

**Testing**:
- Add test MCP server to database
- Verify status display on dashboards
- Test tool execution via edge function

---

### 7. Universal Workflow Engine Module
**Location**: `src/components/WorkflowBuilder.tsx`, `src/components/WorkflowExecutionHistory.tsx`, `src/components/WorkflowTriggerManager.tsx`, `supabase/functions/workflow-executor/`, `supabase/functions/workflow-webhook/`

**Responsibilities**:
- Visual workflow builder with multi-step configuration
- Webhook, scheduled, and event-based triggers
- Workflow execution orchestration with conditional logic
- Real-time execution monitoring and logging
- Cross-system automation and integration

**Frontend Components**:

#### WorkflowBuilder
```typescript
const WorkflowBuilder = ({ customerId }: { customerId: string }) => {
  // Visual workflow creation interface
  // Step configuration (API calls, data transforms, conditions, etc.)
  // Trigger setup (webhook, schedule, manual)
  // Save and test workflows
};
```

**Step Types**:
- `api_call` - HTTP requests to external APIs
- `data_transform` - Data mapping and transformation
- `condition` - Branching logic (if/switch)
- `notification` - Send alerts and notifications
- `database_operation` - CRUD on database tables
- `delay` - Wait/sleep operations
- `loop` - Iterate over data sets

#### WorkflowExecutionHistory
```typescript
const WorkflowExecutionHistory = ({ customerId }: { customerId: string }) => {
  // Display recent workflow runs
  // Show execution status, duration, logs
  // Real-time updates on running workflows
  // Error details and troubleshooting
};
```

#### WorkflowTriggerManager
```typescript
const WorkflowTriggerManager = ({ customerId }: { customerId: string }) => {
  // Manage webhook triggers with auto-generated URLs
  // Configure scheduled triggers (cron)
  // Enable/disable triggers
  // Test webhook endpoints
  // Copy webhook URLs to clipboard
};
```

**Backend Edge Functions**:

#### workflow-executor
```typescript
// supabase/functions/workflow-executor/index.ts
serve(async (req) => {
  const { workflow_id, trigger_data, triggered_by } = await req.json();
  
  // 1. Fetch workflow definition
  // 2. Create execution record
  // 3. Execute steps sequentially
  // 4. Handle conditional branching
  // 5. Log each step result
  // 6. Update execution status
  // 7. Return execution results
});
```

**Supported Step Executions**:
- API calls with configurable headers/body
- Data transformation via JSON mapping
- Conditional evaluation (operators: equals, greater_than, contains, etc.)
- Database operations (insert, update, delete)
- Delay/wait operations
- Error handling and retry logic

#### workflow-webhook
```typescript
// supabase/functions/workflow-webhook/index.ts
serve(async (req) => {
  const webhookId = req.url.searchParams.get('id');
  const payload = await req.json();
  
  // 1. Validate webhook ID
  // 2. Verify webhook signature (if configured)
  // 3. Update last_triggered_at timestamp
  // 4. Call workflow-executor with payload
  // 5. Return execution status
});
```

**Security Features**:
- HMAC SHA-256 signature verification
- Webhook secrets per trigger
- Auto-generated secure webhook URLs
- Request validation and sanitization

**Database Tables**:

```sql
-- Workflow definitions
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  description TEXT,
  steps JSONB,  -- Array of step configurations
  systems_involved TEXT[],
  is_active BOOLEAN DEFAULT true,
  workflow_type TEXT,  -- 'manual', 'webhook', 'schedule', 'event'
  version INTEGER DEFAULT 1,
  tags TEXT[],
  avg_completion_time INTEGER,
  total_executions INTEGER,
  successful_executions INTEGER
);

-- Execution history
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows,
  customer_id UUID NOT NULL,
  triggered_by TEXT NOT NULL,  -- 'manual', 'webhook', 'schedule', 'event'
  trigger_data JSONB,
  status TEXT DEFAULT 'running',  -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'  -- Step-by-step logs
);

-- Trigger configurations
CREATE TABLE workflow_triggers (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows,
  customer_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,  -- 'webhook', 'schedule', 'event', 'manual'
  trigger_config JSONB DEFAULT '{}',
  webhook_url TEXT,
  webhook_secret TEXT,
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ
);

-- Conditional logic
CREATE TABLE workflow_conditions (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows,
  step_id TEXT NOT NULL,
  condition_type TEXT NOT NULL,  -- 'if', 'switch', 'loop'
  condition_expression JSONB NOT NULL,
  true_path JSONB,
  false_path JSONB
);
```

**Dependencies**:
- Database tables: `workflows`, `workflow_executions`, `workflow_triggers`, `workflow_conditions`
- Edge functions: `workflow-executor`, `workflow-webhook`
- Supabase Edge Runtime (Deno)
- HMAC signature verification (Web Crypto API)

**Integration with Operations Dashboard**:
```typescript
// src/pages/OperationsDashboard.tsx
<Tabs defaultValue="workflows">
  <TabsList>
    <TabsTrigger value="workflows">Workflow Builder</TabsTrigger>
    <TabsTrigger value="triggers">Triggers</TabsTrigger>
    <TabsTrigger value="history">Execution History</TabsTrigger>
    <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
  </TabsList>
  <TabsContent value="workflows">
    <WorkflowBuilder customerId={customerId} />
  </TabsContent>
  {/* ... other tabs ... */}
</Tabs>
```

**Use Cases**:
1. **Employee Onboarding**: Automated provisioning across HRIS, IT systems, compliance
2. **Compliance Workflows**: Evidence collection, approval chains, reporting
3. **IT Operations**: Incident response, server provisioning, security patching
4. **Business Processes**: Invoice approval, contract workflows, vendor onboarding

**Testing**:
- Create test workflow with multiple steps
- Test webhook triggers with external systems
- Verify conditional branching logic
- Check execution logs for debugging
- Test error handling and recovery

---

## 🔗 Module Dependencies

### Dependency Graph

```
┌─────────────────┐
│ Authentication  │
└────────┬────────┘
         │
         ├─────────────┬─────────────┬─────────────┬─────────────┐
         │             │             │             │             │
┌────────▼────────┐ ┌──▼────────┐ ┌─▼─────────┐ ┌──▼──────────┐ ┌──▼──────────────┐
│ Customization   │ │ Dashboard │ │ AI Module │ │ Integration │ │ Workflow Engine │
│                 │ │           │ │           │ │             │ │                 │
└─────────────────┘ └───────────┘ └───────────┘ └─────────────┘ └─────────────────┘
                         │             │                               │
                         │             │                               │
                         └──────┬──────┘                               │
                                │                                      │
                         ┌──────▼──────┐                               │
                         │ MCP Server  │◄──────────────────────────────┘
                         └─────────────┘
```

**Note**: Workflow Engine integrates with MCP Server for advanced AI-powered automation and can trigger or be triggered by other modules.

### Shared Dependencies

All modules depend on:
- **Supabase Client**: `src/integrations/supabase/client.ts`
- **TypeScript Types**: `src/integrations/supabase/types.ts`
- **UI Components**: `src/components/ui/*`
- **Utilities**: `src/lib/utils.ts`

---

## 🔄 Module Interaction Flows

### Flow 1: User Signup → Customized Dashboard

```
1. User submits signup form
   └─> Authentication Module: Create user in Supabase Auth
   
2. Trigger creates customer + profile + customizations
   └─> Database: Insert into 3 tables with relationships
   
3. Redirect to department dashboard
   └─> Dashboard Module: Check access
   
4. Load customer customization
   └─> Customization Module: Fetch and apply branding
   
5. Fetch department data
   └─> Dashboard Module: Query with RLS enforcement
   
6. Render dashboard with AI assistant
   └─> AI Module: Initialize chat interface
```

### Flow 2: AI Assistant Query

```
1. User sends message in dashboard
   └─> AI Module (Frontend): Collect message + department
   
2. Call edge function
   └─> AI Module (Backend): Receive request
   
3. Fetch department context
   └─> Dashboard Module: Query relevant data
   
4. Generate AI response
   └─> AI Module (Backend): Route to Lovable AI model
   
5. Stream response to frontend
   └─> AI Module (Frontend): Display in chat
```

### Flow 3: Integration Status Check

```
1. Dashboard loads
   └─> Dashboard Module: Fetch integrations for customer
   
2. Query integrations table
   └─> Integration Module: Filter by customer_id
   
3. Display status indicators
   └─> Dashboard Module: Show active/inactive/error
   
4. User clicks integration
   └─> Integration Module: Navigate to IntegrationsPage
   
5. Show detailed info
   └─> Integration Module: Display auth, permissions, setup
```

### Flow 4: Workflow Execution (Webhook Trigger)

```
1. External system sends webhook
   └─> workflow-webhook Edge Function: Receive POST request
   
2. Validate webhook ID and signature
   └─> Workflow Engine: Verify trigger configuration
   
3. Update last_triggered_at timestamp
   └─> Database: workflow_triggers table
   
4. Call workflow-executor
   └─> workflow-executor Edge Function: Start execution
   
5. Fetch workflow definition
   └─> Database: workflows table
   
6. Create execution record
   └─> Database: workflow_executions table (status: 'running')
   
7. Execute steps sequentially
   └─> Workflow Engine: Process each step type
      ├─> API calls to external systems
      ├─> Data transformations
      ├─> Conditional branching
      ├─> Database operations
      └─> Delays/loops
   
8. Log step results
   └─> Database: Update execution_log (JSONB array)
   
9. Complete execution
   └─> Database: Update workflow_executions (status: 'completed')
   
10. Display in UI
    └─> WorkflowExecutionHistory: Real-time status update
```

---

## 🧪 Module Testing Strategy

### Unit Testing
Each module should be testable in isolation:
- **Authentication**: Mock Supabase Auth calls
- **Customization**: Test CSS variable application
- **Dashboard**: Verify data fetching and rendering
- **AI**: Mock edge function responses

### Integration Testing
Test module interactions:
- **Signup → Dashboard**: Full flow from auth to customized UI
- **AI Query**: Frontend → Edge Function → Database → Response
- **Integration Display**: Database → UI rendering

### RLS Policy Testing
Verify data isolation:
- User A cannot see User B's data (different customers)
- Department filtering works correctly
- Admin can see all customers

---

## 📚 Module Documentation Standards

Each module should have:

1. **README** (if complex): Overview, usage, dependencies
2. **Inline Comments**: Explain non-obvious logic
3. **Type Definitions**: Clear interfaces for data structures
4. **Usage Examples**: Show how to integrate with other modules

### Example Module Header

```typescript
/**
 * Customer Customization Module
 * 
 * Loads and applies per-customer UI branding (logo, colors, features).
 * 
 * @module useCustomerCustomization
 * 
 * Usage:
 *   const { customization, isLoading } = useCustomerCustomization(customerId);
 * 
 * Dependencies:
 *   - Database: customer_customizations table
 *   - CSS: Design tokens in src/index.css
 * 
 * Related:
 *   - ARCHITECTURE.md: Design System section
 *   - Auth.tsx: Customization created on signup
 */
```

---

## 🔧 Module Maintenance Guidelines

### Adding a New Module

1. **Define Responsibility**: What does this module do?
2. **Identify Dependencies**: What does it need?
3. **Design Interface**: How do other modules use it?
4. **Document**: Add to this file + inline comments
5. **Test**: Unit and integration tests

### Modifying an Existing Module

1. **Review Documentation**: Understand current behavior
2. **Check Dependencies**: What else might break?
3. **Update Tests**: Ensure changes don't break contracts
4. **Update Docs**: Reflect changes in this file

### Deprecating a Module

1. **Identify Dependents**: What uses this module?
2. **Plan Migration**: How to replace functionality?
3. **Communicate**: Notify team of deprecation timeline
4. **Remove**: Delete code and update docs

---

## 🎯 Module Ownership

| Module | Primary Responsibility | Files |
|--------|----------------------|-------|
| Authentication | User access control | `Auth.tsx`, `client.ts` |
| Customization | Per-customer branding | `useCustomerCustomization.tsx` |
| Dashboard | Role-based views | `*Dashboard.tsx` |
| Integration | External system registry | `Integrations.tsx`, `IntegrationsPage.tsx` |
| AI | Department assistants | `DepartmentAIAssistant.tsx`, `department-assistant/index.ts` |
| MCP Server | Advanced AI capabilities | `MCPServerStatus.tsx`, `mcp-server/index.ts` |

---

**Strategic Note**: This modular structure ensures that any developer can work on a specific subsystem without understanding the entire codebase. Each module is documented, testable, and replaceable—maintaining OberaConnect's continuity strategy.