# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OberaConnect Platform** is a multi-tenant SaaS platform for MSPs (Managed Service Providers) built with React + TypeScript and Lovable Cloud (Supabase). The platform provides department-specific dashboards, AI-powered assistance, and integrations with external systems like Microsoft 365, CIPP, NinjaOne, and Revio.

### Business Context

**Obera is an active MSP** managing 50-500 endpoints for business clients in regulated industries:
- **Obera's Clients**: Healthcare companies, law firms, financial institutions (the businesses Obera serves)
- **Current Vendor Stack**: NinjaOne (RMM), UniFi, Keeper Security, SonicWall, MikroTik, MS365
- **Core Pain Points**: Poor workflow automation across tools + compliance gaps
- **OberaConnect Purpose**: Built to solve Obera's own MSP operational challenges first, then productize for other MSPs

**Critical: B2B2C Model**

OberaConnect serves TWO user types:
1. **Obera Employees** (MSP Staff): Use OberaConnect to manage all client operations
2. **Obera's Business Clients**: Get direct access to portals to view their compliance, submit tickets, manage IT

**Deployment Model**: Hybrid approach
- Some clients access Obera-managed platform (SaaS)
- Some clients may self-host in their own infrastructure
- Obera manages all user accounts (clients don't self-manage users)

**Client Use Cases** (Example: Dr. Smith's Clinic):
- View HIPAA compliance dashboard
- Submit and track support tickets to Obera
- See their devices and IT assets
- Access monthly security/compliance reports
- Manage their employees' IT access (via Obera)

**"Dogfooding" Approach**: Like NinjaOne (founded by MSPs), OberaConnect is built by practitioners solving real operational pain, not software developers guessing at MSP needs.

**Core Statistics:**
- 70+ pages across 8 department dashboards
- 90+ database tables with Row Level Security (RLS)
- 26+ edge functions for serverless backend operations
- 50+ React components with shadcn/ui + Radix UI

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm preview
```

### Testing
There are no automated test suites. Testing is done through:
- **System Validation Dashboard**: `/test/validation` - Database schema, RLS policies, edge functions, and performance testing
- **Comprehensive Test Dashboard**: `/test/comprehensive` - Test data generation, security fuzz testing, and database flow tracing
- Manual testing in preview environment

### Supabase Edge Functions
Edge functions are located in `supabase/functions/` and deployed automatically via Lovable Cloud. Key functions include:
- `department-assistant` - Department-specific AI chat
- `workflow-executor` - Workflow orchestration
- `graph-api` - Microsoft 365 Graph API integration
- `cipp-sync` - CIPP tenant management
- `ninjaone-sync` - RMM device synchronization

Test edge functions locally using Supabase CLI (if needed), but primary deployment is through Lovable Cloud.

## Architecture & Design Patterns

### Hub-and-Spoke Architecture
The platform uses a **database-centric hub architecture** where:
- **Central Hub**: Lovable Cloud (Supabase) with `customers` table as root entity
- **Authentication Layer**: All access flows through Supabase Auth + Row Level Security (RLS)
- **Feature Spokes**: Department dashboards, workflows, compliance, integrations
- **Data Flow**: All features read/write through the central database
- **AI Enhancement**: AI assistants augment features but are not required for core operations

### Database-First Design
The schema follows a strict hierarchy:
```
customers (root entity)
├── user_profiles (linked to auth.users)
├── customer_customizations (branding & features)
├── integrations (external systems)
├── workflows
├── compliance_frameworks
└── applications
```

All tables enforce multi-tenant isolation via RLS policies. Users can only access data for their `customer_id` and department role.

### Critical Security Principles
1. **Row Level Security (RLS)**: ALL database tables MUST have RLS policies. Never bypass RLS or use service role keys in frontend code.
2. **Multi-Tenant Isolation**: Every query that accesses customer data MUST filter by `customer_id` or rely on RLS policies to enforce isolation.
3. **Two-Tier Access Control**:
   - **Obera employees** (`is_client_user = FALSE`): Can see all client data for Obera's customers
   - **Client employees** (`is_client_user = TRUE`): Can ONLY see their own organization's data
4. **Department-Based Access**: Users should only see data relevant to their department (admin, compliance, it, operations, hr, finance, sales, executive).
5. **Audit Logging**: Use `useAuditLog` hook for all privileged access (RMM systems, sensitive operations) and compliance-critical actions.
6. **Client Data Privacy**: Client employees must NEVER see other clients' data, even accidentally. Test RLS policies thoroughly.

### Frontend Patterns

#### Component Organization
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (shadcn/ui)
│   ├── rbac/           # Role-based access control components
│   └── [feature].tsx   # Feature-specific components
├── pages/              # Route-level pages (70+ pages)
├── hooks/              # Custom React hooks
├── integrations/       # Supabase client & types
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

#### Key Custom Hooks
- **`useCustomerCustomization(customerId)`**: Loads and applies customer-specific branding (logo, colors) via CSS variables. Always call this in dashboard components.
- **`useDemoMode()`**: Detects preview/demo environment. Returns `{ isDemoMode: boolean }`.
- **`useAuditLog()`**: Centralized audit logging. Use `logAction()` for general events and `logPrivilegedAccess()` for RMM/privileged system access.
- **`useRepetitiveTaskDetection()`**: Tracks user actions and suggests automation opportunities.
- **`useRevioData()`**: Fetches billing and revenue data from Revio integration.
- **`useProducts()`**: CRUD operations for product catalog management.

#### State Management
- **TanStack Query (React Query)**: Used for all async data fetching and caching
- No global state libraries (Redux, Zustand, etc.)
- Local state with `useState` for UI-only state
- Server state managed by React Query with automatic cache invalidation

#### Routing Strategy
React Router v6 with role-based access. Key routes:
- `/` - Landing page (public)
- `/auth` - Authentication (public)
- `/portal` - Employee portal with app launcher (authenticated)
- `/admin` - Admin dashboard (admin role only)
- `/dashboard/:department` - Department-specific dashboards
- `/test/validation` - System validation dashboard (admin only)
- `/test/comprehensive` - Comprehensive testing (admin only)

### Styling & Theming

#### Design System
All styling uses **Tailwind CSS with semantic design tokens**. Never use hardcoded colors.

Design tokens are defined in `src/index.css`:
```css
:root {
  --primary: [HSL];
  --secondary: [HSL];
  --accent: [HSL];
  --background: [HSL];
  --foreground: [HSL];
}
```

Customer-specific branding is applied by `useCustomerCustomization` which overrides CSS variables at runtime.

#### Component Library
- **Base**: shadcn/ui + Radix UI primitives (pre-configured in `components/ui/`)
- **Icons**: lucide-react
- **Charts**: recharts
- **Styling**: Tailwind with design tokens (no inline styles, no hardcoded colors)

When adding new components, use existing shadcn/ui components from `components/ui/` directory and follow the established patterns.

## Database Patterns

### Core Tables & Relationships
- **`customers`**: Root entity representing client organizations
- **`user_profiles`**: Links to `auth.users`, includes `customer_id` and `department`
- **`customer_customizations`**: Per-customer branding (logo, colors, enabled features)
- **`applications`**: Employee application registry for app launcher
- **`integrations`**: External system connection registry
- **`workflows`**: Cross-system workflow definitions
- **`audit_logs`**: Comprehensive audit trail for privileged access and compliance

### Querying Best Practices
Always use the Supabase client from `@/integrations/supabase/client`:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Fetch customer-scoped data (RLS enforces automatically)
const { data, error } = await supabase
  .from('integrations')
  .select('*')
  .eq('customer_id', customerId); // RLS will enforce this

// Use React Query for data fetching
const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: async () => {
    const { data } = await supabase.from('customers').select('*');
    return data;
  }
});
```

### RLS Policy Awareness
- RLS policies automatically filter data by `customer_id` and user role
- Never use service role key (`SUPABASE_SERVICE_ROLE_KEY`) in frontend code
- Admin users can see all customers; regular users see only their organization
- Draft content (e.g., knowledge articles) is only visible to the creator

## Integration Architecture

### External Systems
The platform integrates with:
1. **Microsoft 365**: Calendar, Email, Teams, OneDrive (via Graph API)
2. **CIPP**: Centralized Microsoft 365 tenant management and security automation
3. **NinjaOne**: RMM and infrastructure management
4. **Revio**: Billing and revenue data (infrastructure ready, live API pending OneBill migration)
5. **Keeper Security**: Password management
6. **SharePoint**: Document synchronization

### Integration Registry Pattern
All integrations are tracked in the `integrations` table with:
- `customer_id` (optional, NULL for system-wide)
- `system_name` and `integration_type`
- `status` ('active' | 'inactive' | 'error')
- `config` (JSONB for flexible configuration)
- `last_sync` timestamp

### Audit Logging for Integrations
When accessing privileged systems (NinjaOne, CIPP, etc.), always log the action:

```typescript
const { logPrivilegedAccess } = useAuditLog();

// Log access to RMM system
await logPrivilegedAccess({
  system_name: 'ninjaone',
  action_type: 'device_access',
  details: { device_id: deviceId }
});
```

## AI & Workflow Features

### Department AI Assistants
Each department dashboard includes a specialized AI assistant component: `DepartmentAIAssistant.tsx`

The assistant:
- Receives department context (IT, compliance, operations, etc.)
- Calls `department-assistant` edge function
- Routes to appropriate AI model via Lovable AI (Gemini, GPT)
- Maintains conversation history in `ai_interactions` table

### MCP Server Integration
Model Context Protocol (MCP) provides advanced AI capabilities:
- Registry: `mcp_servers` table tracks available servers
- Status tracking: `MCPServerStatus.tsx` component
- Edge function: `mcp-server/index.ts`
- Capabilities: Tool execution, structured outputs, multi-step reasoning

### Workflow Engine
The universal workflow engine supports:
- Visual builder: `WorkflowBuilder.tsx` (drag-and-drop)
- Trigger types: webhook, scheduled (cron), event-based
- Conditional logic: if/switch/loop
- Multi-step execution with error handling
- Real-time logs in `WorkflowExecutionHistory.tsx`

Edge functions:
- `workflow-executor`: Executes workflows
- `workflow-webhook`: Handles webhook triggers
- `workflow-orchestrator`: Coordinates multi-workflow operations

## Common Development Tasks

### Adding a New Dashboard Component
1. Create component in `src/components/[ComponentName].tsx`
2. Use design tokens for styling (e.g., `bg-primary`, `text-accent`)
3. Import and use in the relevant dashboard page
4. Test with multiple customer customizations to ensure branding applies correctly

### Adding a New Department Dashboard
1. Create `src/pages/[Department]Dashboard.tsx`
2. Follow pattern from existing dashboards (check `AdminDashboard.tsx` or `ComplianceDashboard.tsx`)
3. Include: Stats cards, department-specific widgets, `DepartmentAIAssistant` component
4. Add route in `src/App.tsx`
5. Update `user_profiles.department` enum to include new department type (database migration required)

### Adding a New Integration
1. Add entry to `integrations` table (manual or via admin UI)
2. Update `IntegrationsPage.tsx` with integration details (auth methods, setup instructions)
3. Create edge function in `supabase/functions/[integration-name]/` if backend logic needed
4. Add integration-specific components (e.g., `CIPPDashboard.tsx` for CIPP)
5. Update audit logging to track integration access

### Adding a New Edge Function
1. Create directory in `supabase/functions/[function-name]/`
2. Add `index.ts` with Deno runtime imports
3. Implement function logic with proper error handling
4. Deploy via Lovable Cloud (auto-deployed on commit)
5. Call from frontend using `supabase.functions.invoke('[function-name]', { body })`

### Modifying Database Schema
⚠️ **Database migrations are managed via Lovable Cloud**. Do not manually edit the database schema.

To request schema changes:
1. Document the required tables/columns
2. Submit via Lovable Cloud interface or coordinate with admin
3. Test new schema in development environment
4. Verify RLS policies are applied to new tables

## File Path Alias
The project uses `@/` as an alias for the `src/` directory (configured in `vite.config.ts`):

```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@/components/ui/button'
```

## Environment Variables
Environment variables are auto-managed by Lovable Cloud. Key variables:
- `VITE_SUPABASE_URL` - Backend API endpoint
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anonymous access key (safe for frontend)
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

Never commit `.env` files or expose service role keys.

## Important Constraints

### Do Not
- Bypass RLS policies or use service role keys in frontend
- Hardcode customer IDs or use magic strings
- Use inline styles or hardcoded color values
- Create components without considering customer branding (clients see their own logo/colors)
- Access privileged systems without audit logging
- Modify database schema directly (use Lovable Cloud)
- Deploy edge functions manually (auto-deployed)
- Show technical jargon to client users (they're often non-technical)
- Allow client users to see other clients' data (test RLS thoroughly!)

### Always
- Use `useCustomerCustomization` in dashboard components (critical for client branding)
- Apply design tokens for all styling
- Enforce RLS by filtering on `customer_id` AND checking `is_client_user` flag
- Log privileged access with `useAuditLog`
- Use TanStack Query for data fetching
- Follow existing component patterns from `components/ui/`
- Test with multiple customer customizations
- Design client-facing features for non-technical users (simple language, clear visuals)
- Consider client portal experience: Would a clinic office manager understand this feature?

## Key Documentation Files
- **README.md**: Project overview, features, and quick start
- **OBERACONNECT_BUSINESS_MODEL_AND_STRATEGY.md**: ⭐ B2B2C business model, client portal strategy, revenue model (MUST READ)
- **STRATEGIC_ANALYSIS_AND_PATH_FORWARD.md**: Competitive analysis, market research, product roadmap
- **ARCHITECTURE.md**: System architecture, database schema, and data flows (725 lines)
- **API_REFERENCE.md**: Complete API documentation for database and edge functions
- **MODULE_STRUCTURE.md**: Detailed module organization and responsibilities
- **TESTING_GUIDE.md**: Testing dashboards and validation procedures
- **ONBOARDING.md**: New developer guide with first-week tasks
- **DOCUMENTATION_INDEX.md**: Master catalog of all 25+ documentation files

## Troubleshooting

### Common Issues
1. **RLS blocking queries**: Verify user has correct `customer_id` in `user_profiles` and appropriate role
2. **Customization not applying**: Check `customer_customizations` record exists and `useCustomerCustomization` is called
3. **Edge function errors**: Check function logs in Lovable Cloud dashboard and verify secrets are configured
4. **Integration not syncing**: Check `integrations.status` field and `last_sync` timestamp

### Debugging Tools
- **System Validation Dashboard** (`/test/validation`): Database schema, RLS policies, edge function health
- **Comprehensive Test Dashboard** (`/test/comprehensive`): Test data generation, security fuzz testing
- **Browser DevTools**: Network tab for API calls, Console for frontend errors
- **Supabase Dashboard**: Query performance, edge function logs, RLS policy hits

## Additional Context

### Platform Philosophy
OberaConnect follows a **resilient, modular architecture** designed for:
- **Team continuity**: Platform remains operational regardless of team changes
- **Extensibility**: New features can be added without full system knowledge
- **Customer-specific customization**: No code changes needed for per-customer branding
- **AI as enhancement**: AI tools augment features but aren't required for core operations

### Strategic Ownership & Product Direction

Design decisions remain with OberaConnect leadership:
- Schema structure and entity relationships
- Department role definitions and access patterns
- Integration mapping and authentication flows
- AI assistant behavior and model selection
- Workflow orchestration patterns

**Product Development Philosophy:**
1. **Solve Obera's pain first**: Features should address real operational challenges Obera faces with their business clients
2. **Battle-test in production**: All features validated in Obera's MSP operations before considering productization
3. **Compliance-first mindset**: Features must support HIPAA, SOC 2, ISO requirements for Obera's regulated clients
4. **Workflow automation focus**: Priority on reducing manual tasks (onboarding, reporting, evidence collection)
5. **Vendor consolidation**: Replace tool sprawl (NinjaOne + 5 other tools) with unified platform

**Target End Users:**

1. **Primary Users - Obera Employees (MSP Staff)**:
   - IT technicians, compliance specialists, operations managers
   - Need full access to manage all clients
   - Power users with technical expertise

2. **Secondary Users - Obera's Business Clients**:
   - Healthcare: Clinic office managers, doctors, medical staff
   - Legal: Law firm administrators, lawyers, paralegals
   - Finance: Bank executives, credit union IT staff, accountants
   - **Key: Often non-technical users** - UI must be simple, clear, executive-friendly
   - Only see their own organization's data
   - Use for: compliance visibility, ticket submission, reports, IT asset view

**Future Customers (Other MSPs):**
When productized, OberaConnect will be sold to MSPs serving similar regulated business clients, who will also give their clients portal access.

When in doubt, maintain existing patterns and consult with project leadership before introducing new architectural approaches.
