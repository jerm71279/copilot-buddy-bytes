# Architecture Updates - October 29, 2025

## Overview
This document captures architectural improvements made during the systematic codebase enhancement initiative.

---

## 1. Layout Standardization

### DashboardLayout Component
All dashboard and page components now use the centralized `DashboardLayout` component for consistency.

**Location:** `src/components/layouts/DashboardLayout.tsx`

**Benefits:**
- Consistent spacing and padding across all pages
- Responsive breakpoint handling
- Automatic header/footer integration
- Easy global layout updates
- Built-in semantic HTML structure

**Usage:**
```tsx
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const MyDashboard = () => {
  return (
    <DashboardLayout className="space-y-6">
      {/* Your dashboard content */}
    </DashboardLayout>
  );
};
```

**Migration from Old Pattern:**
```tsx
// ❌ OLD - Inconsistent, hard to maintain
<div className="min-h-screen bg-background">
  <div className="container mx-auto px-4 pb-8 pt-8">
    {/* content */}
  </div>
</div>

// ✅ NEW - Standardized, maintainable
<DashboardLayout className="space-y-6">
  {/* content */}
</DashboardLayout>
```

### Standardized Pages
**Critical Dashboards (7/7):**
- ComplianceDashboard
- FinanceDashboard
- ITDashboard
- HRDashboard
- OperationsDashboard
- ExecutiveDashboard
- SalesDashboard
- SOCDashboard

**Portal & Admin (8/8):**
- Portal
- ClientPortal
- SalesPortal
- CustomerAdmin
- NavigationScaffold
- Developers
- Validator
- SAWManagement

**Data Lake (2/2):**
- DataGovernance
- DataLineage

---

## 2. Service Layer Architecture

### BaseService Class
All services now extend or use utilities from `BaseService` for consistent error handling and response formatting.

**Location:** `src/services/baseService.ts`

**Key Features:**
- Standardized error handling
- Type-safe response objects
- Common authentication utilities
- Consistent error formatting

**Usage Pattern:**
```tsx
import { BaseService, ServiceResponse } from "@/services/baseService";

export class MyService extends BaseService {
  static async getData(id: string): Promise<ServiceResponse<MyData>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('my_table')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    });
  }
}
```

**Response Pattern:**
```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

interface ServiceError {
  message: string;
  code?: string;
  details?: any;
}
```

### Service Guidelines

1. **Always use `.maybeSingle()` instead of `.single()`**
   - Prevents errors when no results found
   - Returns null instead of throwing

2. **Wrap all queries with `executeQuery()`**
   - Provides consistent error handling
   - Formats responses uniformly

3. **Use `getCurrentUser()` for auth checks**
   - Centralized authentication logic
   - Throws if not authenticated

4. **Return `ServiceResponse<T>` type**
   - Client code can check `error` property
   - Type-safe data access

---

## 3. Design System

### Color System
All components use semantic tokens from `index.css` and `tailwind.config.ts`.

**Forbidden:**
```tsx
// ❌ NEVER hardcode colors
<div className="text-green-600 border-blue-500 bg-white">
```

**Correct:**
```tsx
// ✅ ALWAYS use semantic tokens
<div className="text-primary border-border bg-background">
```

### Component Variants
Use shadcn/ui component variants defined in the design system:
```tsx
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Badge variant="default">Status</Badge>
<Alert variant="destructive">Error Message</Alert>
```

---

## 4. Security Patterns

### Edge Function Input Validation
All edge functions must validate input:

```typescript
const requestData = await req.json();

// Validate input
if (!requestData || typeof requestData !== 'object') {
  return new Response(
    JSON.stringify({ error: 'Invalid request body' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Validate specific fields
const name = String(requestData.name || '').slice(0, 100);
if (!name) {
  return new Response(
    JSON.stringify({ error: 'name is required' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Database Query Safety
- Always use `.maybeSingle()` for single-record queries
- Handle null returns gracefully
- Never execute raw SQL from user input

---

## 5. File Organization

### Services Directory
`src/services/` - All business logic and data access
- Each domain has its own service (e.g., `financeService.ts`)
- All extend or use `BaseService`
- Type-safe with TypeScript

### Layouts Directory
`src/components/layouts/` - Reusable layout components
- `DashboardLayout.tsx` - Main dashboard layout
- Future: `AuthLayout.tsx`, `PublicLayout.tsx`, etc.

### Pages Directory
`src/pages/` - Page-level components
- All use DashboardLayout or appropriate layout
- Minimal business logic (delegated to services)
- Focus on UI composition

---

## 6. Testing Strategy

### Unit Tests
- All services have corresponding `.test.ts` files
- Use Vitest with jsdom environment
- Mock Supabase client in tests

### Component Tests
- Test components in isolation
- Mock service responses
- Use React Testing Library

### Integration Tests
- Test full user flows
- Use real database (test environment)
- Verify edge function behavior

---

## 7. Performance Optimizations

### React Query Usage
- All data fetching uses React Query
- Automatic caching and revalidation
- Optimistic updates where appropriate

### Code Splitting
- Lazy load routes with React.lazy
- Split large components into smaller chunks
- Dynamic imports for heavy dependencies

### Memoization
- Use useMemo for expensive computations
- Use useCallback for stable function references
- Avoid unnecessary re-renders

---

## 8. Documentation Standards

### Code Documentation
- JSDoc comments for all public APIs
- Inline comments for complex logic
- README files in major directories

### Architecture Diagrams
- Mermaid diagrams for data flows
- Component relationship diagrams
- System integration diagrams

### Migration Guides
- Document breaking changes
- Provide before/after examples
- Include automated migration scripts when possible

---

## Next Steps

### Immediate (This Week)
1. Complete remaining layout standardizations
2. Refactor all services to use BaseService
3. Update all edge functions with input validation

### Short Term (This Month)
1. Add comprehensive test coverage
2. Performance audit and optimizations
3. Documentation review and updates

### Long Term (This Quarter)
1. Implement automated testing in CI/CD
2. Add performance monitoring
3. Security audit and hardening

---

**Last Updated:** 2025-10-29  
**Maintained By:** Development Team  
**Version:** 1.0
