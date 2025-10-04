# OberaConnect API Reference

## 🌐 Overview

OberaConnect uses **Supabase** as its backend platform, providing:
- **PostgreSQL Database**: Accessed via Supabase client
- **Edge Functions**: Serverless functions for custom logic and AI integration
- **Authentication**: Managed by Supabase Auth

All API access is authenticated and protected by Row Level Security (RLS) policies.

## 🔐 Authentication

### Supabase Client Setup

```typescript
import { supabase } from '@/integrations/supabase/client';
```

The client is pre-configured with your project credentials and available globally.

### Auth Methods

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
  options: {
    data: {
      full_name: 'John Doe',
      department: 'compliance'
    }
  }
});

// Returns: { user, session }
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123'
});

// Returns: { user, session }
```

#### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession();

// Returns: { session: { user, access_token, ... } } or { session: null }
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

---

## 📊 Database API

### Core Tables

#### Customers
```typescript
// Fetch all customers (admin only, RLS enforced)
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .order('created_at', { ascending: false });

// Fetch specific customer
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('id', customerId)
  .single();

// Create customer
const { data, error } = await supabase
  .from('customers')
  .insert({
    company_name: 'Acme Corp',
    contact_email: 'contact@acme.com',
    plan: 'professional',
    status: 'active'
  })
  .select()
  .single();
```

#### User Profiles
```typescript
// Fetch user's own profile
const { data, error } = await supabase
  .from('user_profiles')
  .select(`
    *,
    customers (
      company_name,
      plan,
      status
    )
  `)
  .eq('user_id', userId)
  .single();

// Update profile
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    full_name: 'Jane Doe',
    role: 'manager'
  })
  .eq('user_id', userId);
```

#### Customer Customizations
```typescript
// Fetch customization for customer
const { data, error } = await supabase
  .from('customer_customizations')
  .select('*')
  .eq('customer_id', customerId)
  .single();

// Update customization
const { data, error } = await supabase
  .from('customer_customizations')
  .update({
    primary_color: '210 100% 50%',  // HSL format
    secondary_color: '180 80% 45%',
    accent_color: '30 95% 55%',
    enabled_integrations: ['azure', 'ninjaone', 'keeper'],
    enabled_features: ['compliance', 'ml_insights']
  })
  .eq('customer_id', customerId);
```

#### Integrations
```typescript
// Fetch all integrations (public)
const { data, error } = await supabase
  .from('integrations')
  .select('*')
  .is('customer_id', null);  // System-wide integrations

// Fetch customer-specific integrations
const { data, error } = await supabase
  .from('integrations')
  .select('*')
  .eq('customer_id', customerId);

// Create integration
const { data, error } = await supabase
  .from('integrations')
  .insert({
    customer_id: customerId,
    system_name: 'NinjaOne',
    integration_type: 'rmm',
    status: 'active',
    config: {
      api_key: 'encrypted_key',
      region: 'us-east-1'
    }
  });
```

#### MCP Servers
```typescript
// Fetch all MCP servers
const { data, error } = await supabase
  .from('mcp_servers')
  .select('*')
  .order('name');

// Check server status
const { data, error } = await supabase
  .from('mcp_servers')
  .select('name, status, capabilities')
  .eq('status', 'online');
```

#### Compliance Frameworks
```typescript
// Fetch frameworks for customer
const { data, error } = await supabase
  .from('compliance_frameworks')
  .select('*')
  .eq('customer_id', customerId);

// Get framework with controls
const { data, error } = await supabase
  .from('compliance_frameworks')
  .select(`
    *,
    compliance_controls (
      id,
      control_name,
      status
    )
  `)
  .eq('id', frameworkId)
  .single();
```

#### Workflows
```typescript
// Fetch workflows for customer
const { data, error } = await supabase
  .from('workflows')
  .select('*')
  .eq('customer_id', customerId);

// Count workflows
const { count, error } = await supabase
  .from('workflows')
  .select('*', { count: 'exact', head: true })
  .eq('customer_id', customerId);
```

#### ML Insights
```typescript
// Fetch recent insights
const { data, error } = await supabase
  .from('ml_insights')
  .select('*')
  .eq('customer_id', customerId)
  .order('created_at', { ascending: false })
  .limit(10);

// Count insights by type
const { data, error } = await supabase
  .from('ml_insights')
  .select('insight_type')
  .eq('customer_id', customerId);
```

### Query Patterns

#### Filtering
```typescript
// Single condition
.eq('status', 'active')
.neq('status', 'deleted')
.gt('created_at', '2025-01-01')
.lt('revenue', 10000)

// Multiple conditions (AND)
.eq('customer_id', customerId)
.eq('status', 'active')

// OR conditions
.or('status.eq.active,status.eq.pending')
```

#### Sorting
```typescript
.order('created_at', { ascending: false })
.order('name', { ascending: true })
```

#### Pagination
```typescript
.range(0, 9)  // First 10 records
.limit(20)    // Limit to 20 records
```

#### Aggregation
```typescript
// Count
const { count } = await supabase
  .from('customers')
  .select('*', { count: 'exact', head: true });

// Sum (use custom SQL or aggregate in code)
```

---

## ⚡ Edge Functions

### Department Assistant

**Endpoint**: `department-assistant`

**Purpose**: AI-powered department-specific assistant

**Request**:
```typescript
const { data, error } = await supabase.functions.invoke('department-assistant', {
  body: {
    department: 'compliance',  // Required
    message: 'What frameworks are we tracking?',  // Required
    customerId: 'uuid-string',  // Optional
    context: {  // Optional
      frameworks: ['SOC2', 'GDPR'],
      controls: 120
    }
  }
});
```

**Response**:
```typescript
{
  response: string;  // AI-generated response
  model: string;     // Model used (e.g., 'google/gemini-2.5-flash')
  timestamp: string;
}
```

**Supported Departments**:
- `compliance`: Frameworks, controls, evidence
- `it`: Integrations, servers, security
- `operations`: Workflows, efficiency, bottlenecks
- `hr`: Employees, sessions, department stats
- `finance`: Revenue, subscriptions, customers
- `sales`: Pipeline, deals, forecasts
- `executive`: KPIs, strategic metrics

**Example Usage**:
```typescript
import { supabase } from '@/integrations/supabase/client';

const askAI = async (message: string) => {
  const { data, error } = await supabase.functions.invoke('department-assistant', {
    body: {
      department: 'compliance',
      message: message,
      context: {
        frameworks: 3,
        controls: 45,
        evidence_files: 230
      }
    }
  });

  if (error) {
    console.error('AI Error:', error);
    return;
  }

  console.log('AI Response:', data.response);
};
```

---

### MCP Server

**Endpoint**: `mcp-server`

**Purpose**: Model Context Protocol integration for advanced AI capabilities

**Request**:
```typescript
const { data, error } = await supabase.functions.invoke('mcp-server', {
  body: {
    action: 'execute_tool',  // Required
    server_id: 'uuid-string',  // Required
    tool_name: 'analyze_data',  // Required
    parameters: {  // Optional
      dataset: 'compliance_metrics',
      timeframe: '30d'
    }
  }
});
```

**Response**:
```typescript
{
  result: any;       // Tool execution result
  server: string;    // MCP server name
  status: string;    // 'success' | 'error'
  timestamp: string;
}
```

**Available Actions**:
- `execute_tool`: Run a tool on MCP server
- `list_capabilities`: Get server capabilities
- `check_status`: Health check

**Example Usage**:
```typescript
const executeMCPTool = async () => {
  const { data, error } = await supabase.functions.invoke('mcp-server', {
    body: {
      action: 'execute_tool',
      server_id: 'mcp-123',
      tool_name: 'risk_analysis',
      parameters: {
        customer_id: customerId,
        frameworks: ['SOC2', 'HIPAA']
      }
    }
  });

  if (error) {
    console.error('MCP Error:', error);
    return;
  }

  console.log('Analysis Result:', data.result);
};
```

---

## 🔄 Realtime Subscriptions

Supabase supports realtime updates for table changes.

### Subscribe to Table Changes

```typescript
const channel = supabase
  .channel('integrations-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: 'public',
      table: 'integrations',
      filter: `customer_id=eq.${customerId}`  // Optional
    },
    (payload) => {
      console.log('Change detected:', payload);
      // Update UI with new data
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Realtime Use Cases

- **Integration Status**: Live updates when integrations change state
- **MCP Server Health**: Real-time server status monitoring
- **Compliance Updates**: Notify when frameworks/controls are updated
- **Chat/Collaboration**: Multi-user dashboard updates

---

### Revio Data Integration

**Endpoint**: `revio-data`

**Purpose**: Customer billing and revenue data aggregation from Revio

**Current Status**: Infrastructure complete with placeholder data until OneBill → Revio migration

**Request**:
```typescript
const { data, error } = await supabase.functions.invoke('revio-data', {
  body: {
    dataType: 'all'  // Required: 'all', 'customers_by_ticket', 'customers_by_sla', 'customers_by_revenue', 'subscriptions', 'recent_interactions'
  }
});
```

**Response**:
```typescript
{
  success: boolean;
  message?: string;
  data: {
    customers_by_ticket: CustomersByTicket[];
    customers_by_sla: CustomersBySLA[];
    customers_by_revenue: CustomersByRevenue[];
    subscriptions: SubscriptionStats;
    recent_interactions: CustomerInteraction[];
  }
}
```

**Example Usage**:
```typescript
import { useRevioData } from '@/hooks/useRevioData';

const SalesDashboard = () => {
  const { data, loading, error } = useRevioData();
  
  if (loading) return <div>Loading revenue data...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Active Subscriptions: {data.subscriptions.active}</h2>
      <h2>Revenue by Tier:</h2>
      {data.customers_by_revenue.map(tier => (
        <div key={tier.revenue_tier}>
          {tier.revenue_tier}: ${tier.total_revenue}
        </div>
      ))}
    </div>
  );
};
```

**Documentation**: See `API_REFERENCE_REVIO.md` for complete Revio API documentation

---

## 🛡️ Row Level Security (RLS)

All tables have RLS policies enforcing data isolation.

### Customer Isolation

Users can only access data belonging to their customer:

```sql
-- Example: user_profiles table
CREATE POLICY "Users view own customer data"
ON user_profiles FOR SELECT
USING (
  customer_id = (
    SELECT customer_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);
```

### Department-Based Access

Some data is further restricted by department:

```sql
-- Example: compliance_frameworks (compliance dept only)
CREATE POLICY "Compliance users access frameworks"
ON compliance_frameworks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND department = 'compliance'
    AND customer_id = compliance_frameworks.customer_id
  )
);
```

### Admin Override

Admins can view all customers:

```sql
CREATE POLICY "Admins view all customers"
ON customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND department = 'admin'
  )
);
```

---

## 📈 Rate Limits & Best Practices

### Rate Limits
- **Database Queries**: 100 requests/second per project
- **Edge Functions**: 500 requests/minute per function
- **Auth**: 30 requests/hour per IP (signup/login)

### Best Practices

1. **Use Supabase Client**: Don't make raw HTTP requests
2. **Batch Queries**: Combine related queries with `select()`
3. **Cache Results**: Use TanStack Query for client-side caching
4. **Limit Results**: Always use `.limit()` for large tables
5. **Index Queries**: Ensure foreign keys are indexed
6. **Handle Errors**: Check `error` object on every call

### Example: Efficient Data Fetching

```typescript
// ❌ BAD: Multiple queries
const customer = await supabase.from('customers').select('*').eq('id', id).single();
const profiles = await supabase.from('user_profiles').select('*').eq('customer_id', id);
const customization = await supabase.from('customer_customizations').select('*').eq('customer_id', id).single();

// ✅ GOOD: Single query with relationships
const { data, error } = await supabase
  .from('customers')
  .select(`
    *,
    user_profiles (*),
    customer_customizations (*)
  `)
  .eq('id', id)
  .single();
```

---

## 🧪 Testing APIs

### Using Supabase Dashboard

1. Navigate to backend UI (View Backend in Lovable)
2. Go to SQL Editor
3. Run test queries

### Using Frontend

```typescript
// Add to component for debugging
useEffect(() => {
  const testAPI = async () => {
    const { data, error } = await supabase
      .from('your_table')
      .select('*');
    
    console.log('Test Data:', data);
    console.log('Test Error:', error);
  };
  
  testAPI();
}, []);
```

---

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Database schema details
- [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md) - How modules use these APIs
- [Supabase Docs](https://supabase.com/docs) - Official Supabase documentation

---

**API Stability**: These APIs are designed for long-term stability. Breaking changes will be versioned and documented. All changes are traceable via Git history and migration files.