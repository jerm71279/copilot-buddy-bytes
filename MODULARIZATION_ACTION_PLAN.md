# Code Modularization Action Plan
**Generated:** 2025-10-27
**Status:** In Progress

## Executive Summary

This document outlines the action plan to refactor 19 pages with direct database queries into a proper service layer architecture, improving maintainability and reducing code redundancy.

---

## ✅ Completed Actions

### Layout Uniformity (5 pages fixed)
All pages now use standard layout pattern:
```tsx
<div className="min-h-screen bg-background">
  <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
```

**Fixed Pages:**
1. ✅ AIImageGenerator.tsx
2. ✅ ArchitectureCanvas.tsx
3. ✅ AssetFinancials.tsx
4. ✅ BudgetTracking.tsx
5. ✅ BusinessKnowledge.tsx

---

## 🔧 Pending Actions: Service Layer Creation

### Priority 1: Core Business Services (High Impact)

#### 1. Budget & Finance Service
**File:** `src/services/financeService.ts`

**Affected Pages:**
- BudgetTracking.tsx
- ExpenseManagement.tsx
- InvoiceManagement.tsx
- PurchaseOrders.tsx

**Required Methods:**
```typescript
// Budget operations
BudgetService.createBudget(data)
BudgetService.updateBudget(id, data)
BudgetService.deleteBudget(id)
BudgetService.getBudgetsByCustomer(customerId)

// Expense operations
ExpenseService.createExpense(data)
ExpenseService.updateExpense(id, data)
ExpenseService.getExpensesByCustomer(customerId)

// Invoice operations
InvoiceService.createInvoice(data)
InvoiceService.updateInvoice(id, data)
InvoiceService.getInvoicesByCustomer(customerId)

// Purchase Order operations
PurchaseOrderService.createPO(data)
PurchaseOrderService.updatePO(id, data)
PurchaseOrderService.getPOsByCustomer(customerId)
```

**Key Schema Fields (from types.ts):**
- Budgets: `allocated_amount`, `budget_name`, `budget_type`, `fiscal_year`, `period_start`, `period_end` (required)
- Expenses: Similar pattern with `expense_number` auto-generated
- Invoices: Similar pattern with `invoice_number` auto-generated
- POs: Similar pattern with `po_number` auto-generated

---

#### 2. HR & Employee Service
**File:** `src/services/hrService.ts`

**Affected Pages:**
- EmployeeDirectory.tsx
- DepartmentManagement.tsx
- LeaveManagement.tsx

**Required Methods:**
```typescript
// Employee operations
EmployeeService.createEmployee(data)
EmployeeService.updateEmployee(id, data)
EmployeeService.deleteEmployee(id)
EmployeeService.getEmployeesByCustomer(customerId)
EmployeeService.getEmployeeById(id)

// Department operations
DepartmentService.createDepartment(data)
DepartmentService.updateDepartment(id, data)
DepartmentService.getDepartmentsByCustomer(customerId)

// Leave operations
LeaveService.createLeaveRequest(data)
LeaveService.updateLeaveRequest(id, data)
LeaveService.getLeaveRequestsByEmployee(employeeId)
```

**Key Schema Fields:**
- Employees: `employee_number`, `first_name`, `last_name`, `email`, `job_title`, `hire_date` (required)
- Leave: Employee ID reference, dates, status

---

#### 3. Sales & CRM Service
**File:** `src/services/salesService.ts`

**Affected Pages:**
- LeadManagement.tsx
- SalesOpportunities.tsx
- SalesQuotes.tsx

**Required Methods:**
```typescript
// Lead operations
SalesService.createLead(data)
SalesService.updateLead(id, data)
SalesService.getLeadsByCustomer(customerId)
SalesService.convertLeadToOpportunity(leadId)

// Opportunity operations
SalesService.createOpportunity(data)
SalesService.updateOpportunity(id, data)
SalesService.getOpportunitiesByCustomer(customerId)

// Quote operations
SalesService.createQuote(data)
SalesService.updateQuote(id, data)
SalesService.getQuotesByCustomer(customerId)
```

**Key Schema Fields:**
- Leads: `lead_number`, `company_name`, `contact_name` (required)
- Opportunities: `account_name`, `contact_name`, `amount`, `expected_close_date` (required)
- Quotes: `quote_number`, `account_name`, `contact_name`, `total_amount` (required)

---

#### 4. Inventory & Warehouse Service
**File:** `src/services/inventoryService.ts`

**Affected Pages:**
- InventoryManagement.tsx
- WarehouseManagement.tsx

**Required Methods:**
```typescript
// Inventory operations
InventoryService.createItem(data)
InventoryService.updateItem(id, data)
InventoryService.deleteItem(id)
InventoryService.getItemsByCustomer(customerId)
InventoryService.adjustQuantity(itemId, quantity)

// Warehouse operations
WarehouseService.createWarehouse(data)
WarehouseService.updateWarehouse(id, data)
WarehouseService.getWarehousesByCustomer(customerId)
```

**Key Schema Fields:**
- Inventory: `item_name`, `sku`, `category`, `current_quantity`, `unit_of_measure` (required)
- Warehouse: `warehouse_name`, `warehouse_code`, `address` (required)

---

### Priority 2: Supplementary Services (Medium Impact)

#### 5. Vendor Management Service
**File:** `src/services/vendorManagementService.ts`

**Affected Pages:**
- VendorManagement.tsx
- VendorDetail.tsx

**Note:** VendorService already exists at `src/services/vendorService.ts` for documentation vendors. Create separate service for vendor management or consolidate.

---

#### 6. Customer Account Service
**File:** `src/services/customerAccountService.ts`

**Affected Pages:**
- CustomerAccounts.tsx

---

#### 7. Project Management Service
**File:** `src/services/projectService.ts`

**Affected Pages:**
- ProjectManagement.tsx

---

### Priority 3: Special Cases (Lower Impact)

#### 8. SharePoint Sync
**File:** `src/services/sharepointService.ts`

**Affected Pages:**
- SharePointSync.tsx

**Note:** Complex integration, may need edge function support.

---

#### 9. Time Tracking
**File:** `src/services/timeTrackingService.ts`

**Affected Pages:**
- TimeTracking.tsx

---

#### 10. System Validation
**Affected Pages:**
- SystemValidationDashboard.tsx

**Note:** This page performs validation queries, not business logic. May not need service layer, just refactoring to use hooks.

---

## Implementation Pattern

### Standard Service Structure
```typescript
import { supabase } from '@/integrations/supabase/client';

/**
 * [Domain] Service
 * Centralizes all [domain]-related database operations
 */

export interface Create[Entity]Input {
  // Match Database Insert type from types.ts
}

export interface Update[Entity]Input extends Partial<Create[Entity]Input> {
  id: string;
}

export class [Entity]Service {
  /**
   * Create a new [entity]
   */
  static async create[Entity](input: Create[Entity]Input) {
    const { data, error } = await supabase
      .from('[table_name]')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create [entity]: ${error.message}`);
    if (!data) throw new Error('Failed to create [entity]: No data returned');
    
    return data;
  }

  /**
   * Update an existing [entity]
   */
  static async update[Entity]({ id, ...updates }: Update[Entity]Input) {
    const { data, error } = await supabase
      .from('[table_name]')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update [entity]: ${error.message}`);
    if (!data) throw new Error('[Entity] not found');
    
    return data;
  }

  /**
   * Delete [entity]
   */
  static async delete[Entity](id: string) {
    const { error } = await supabase
      .from('[table_name]')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete [entity]: ${error.message}`);
  }

  /**
   * Get [entities] by customer
   */
  static async get[Entities]ByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('[table_name]')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch [entities]: ${error.message}`);
    return data || [];
  }
}
```

### Using Services in Components
```typescript
// Before (Direct query in component)
const { error } = await supabase.from("budgets").insert([{
  customer_id: customerId,
  // ... data
}]);

// After (Using service)
import { BudgetService } from '@/services/financeService';

try {
  const budget = await BudgetService.createBudget({
    customer_id: customerId,
    // ... data
  });
  toast.success('Budget created successfully');
} catch (error) {
  toast.error(error.message);
}
```

---

## Validation Checklist

For each service created:

- [ ] All CRUD operations use `.maybeSingle()` instead of `.single()`
- [ ] Null checks implemented for all database responses
- [ ] Error messages are descriptive and user-friendly
- [ ] Input types match Database Insert types from `types.ts`
- [ ] All required fields from schema are included
- [ ] Service methods are properly documented with JSDoc
- [ ] Error handling includes both Supabase errors and null responses

---

## Metrics & Progress

### Current Status
- **Total Pages**: 19
- **Services Created**: 0
- **Pages Refactored**: 0
- **Layouts Fixed**: 5 ✅

### Target Metrics
- **Code Duplication**: Reduce by 80%
- **Maintainability Score**: Increase from current to 90+
- **Database Query Safety**: 100% (all queries use `.maybeSingle()`)

---

## Next Steps

1. **Create Priority 1 Services** (BudgetService, EmployeeService, SalesService, InventoryService)
2. **Refactor 4 pages per service** to use new service layer
3. **Test all CRUD operations** in each refactored page
4. **Run validation script** to confirm zero hardcoded queries
5. **Document patterns** in codebase for future development
6. **Create hooks layer** (optional) for React Query integration

---

## Related Documentation

- `VALIDATION_PROCEDURES.md` - Automated validation checks
- `AI_WORK_PROCEDURES_CHECKLIST.md` - Development workflow
- `RECENT_FIXES_2025_10_15.md` - Change log
- `src/integrations/supabase/types.ts` - Database schema reference

---

## Notes

- All auto-generated fields (e.g., `employee_number`, `invoice_number`) are handled by database triggers
- Services should remain stateless - no caching or state management
- Consider creating React Query hooks (e.g., `useCreateBudget`) after services are stable
- Edge functions may be needed for complex business logic (e.g., cascading updates)
