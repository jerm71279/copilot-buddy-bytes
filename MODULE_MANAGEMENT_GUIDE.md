# Module Management Guide

**Last Updated:** October 14, 2025  
**Feature Version:** 1.0  
**Route:** `/admin/modules`

---

## Overview

The Module Management interface provides organization administrators with centralized control over portal access and dashboard module visibility. This feature enables fine-grained customization of what features are available to users within an organization.

## Purpose

- **Portal Control**: Enable/disable entire portals for your organization
- **Module Visibility**: Control which dashboard categories appear in navigation
- **User Experience**: Customize the platform to match organizational needs
- **License Management**: Restrict features based on licensing or requirements

## Access Requirements

### Prerequisites
- User must be authenticated
- User must have a valid `customer_id` in `user_profiles` table
- Organization must have a record in `customer_customizations` table

### Permission Level
- Admin access required (controlled at route level)
- Changes affect all users in the organization

## Features

### 1. Portal Access Control

Control access to 7 main portals:

| Portal | Description | Default State |
|--------|-------------|---------------|
| **Employee Portal** | Main employee dashboard and app launcher | ✅ Enabled |
| **Client Portal** | External client self-service interface | ✅ Enabled |
| **Admin Portal** | System administration and configuration | ✅ Enabled |
| **Sales Portal** | Sales pipeline and CRM interface | ✅ Enabled |
| **Compliance Portal** | Compliance dashboard and controls | ✅ Enabled |
| **Analytics Portal** | Cross-platform analytics and reporting | ✅ Enabled |
| **Data Flow Portal** | Visual data flow documentation | ✅ Enabled |

### 2. Dashboard Module Control

Manage visibility of 8 dashboard categories:

| Module | Description | Default State |
|--------|-------------|---------------|
| **IT Services** | IT operations and device management | ✅ Enabled |
| **Compliance & Security** | Security controls and compliance tracking | ✅ Enabled |
| **Operations** | Workflow automation and incident management | ✅ Enabled |
| **Finance** | Financial tracking and budget management | ✅ Enabled |
| **Human Resources** | Employee management and onboarding | ✅ Enabled |
| **Sales & Marketing** | Sales pipeline and marketing automation | ✅ Enabled |
| **Engineering** | Development and DevOps tools | ✅ Enabled |
| **Executive** | KPIs and executive dashboards | ✅ Enabled |

## Usage

### Accessing the Page

1. Navigate to `/admin/modules` or access via Admin Dashboard
2. System automatically loads current organization settings
3. Loading indicator displays while fetching data

### Toggling Settings

**To Enable/Disable a Portal:**
1. Locate the portal in the "Portal Access" section
2. Click the toggle switch next to the portal name
3. Switch will update immediately in UI

**To Enable/Disable a Module:**
1. Find the module in the "Dashboard Modules" section
2. Click the toggle switch next to the module name
3. Change is reflected immediately in UI

### Saving Changes

1. Make all desired changes to portals and modules
2. Click "Save Settings" button at bottom of page
3. System validates and saves changes to database
4. Success toast notification appears
5. Page automatically refreshes to apply changes

## Technical Implementation

### Database Schema

**Table:** `customer_customizations`

```sql
CREATE TABLE customer_customizations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  enabled_portals TEXT[], -- Array of portal slugs
  enabled_modules JSONB,   -- Object mapping module slugs to boolean
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Data Structure

**enabled_portals:**
```json
[
  "employee",
  "client",
  "admin",
  "sales",
  "compliance",
  "analytics",
  "data_flow"
]
```

**enabled_modules:**
```json
{
  "it_services": true,
  "compliance_security": true,
  "operations": true,
  "finance": true,
  "hr": true,
  "sales_marketing": true,
  "engineering": true,
  "executive": true
}
```

### Component Architecture

**File:** `src/pages/ModuleManagement.tsx`

**Key Functions:**
- `loadSettings()` - Fetches current customer settings
- `togglePortal(slug)` - Updates portal state in local state
- `toggleModule(slug)` - Updates module state in local state
- `saveSettings()` - Persists changes to database

**State Management:**
```typescript
interface ModuleSettings {
  enabled_portals: string[];
  enabled_modules: Record<string, boolean>;
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance

✅ **Semantic HTML:**
- `<main>` for primary content
- `<header>` for page title
- `<section>` for logical groupings
- `<footer>` for action buttons

✅ **ARIA Labels:**
- All switches have descriptive `aria-label` attributes
- Role attributes for semantic grouping
- Live regions for dynamic content updates
- Screen reader announcements for loading states

✅ **Keyboard Navigation:**
- All controls accessible via Tab key
- Space/Enter to toggle switches
- Focus indicators on all interactive elements
- Logical tab order follows visual layout

✅ **Visual Indicators:**
- Clear on/off states for switches
- Loading spinners with text alternatives
- Success/error messages with proper contrast
- Icons marked `aria-hidden` to avoid duplication

### Screen Reader Support

**Loading State:**
```html
<div role="status" aria-live="polite">
  <Loader2 aria-hidden="true" />
  <span class="sr-only">Loading module settings...</span>
</div>
```

**Switch Controls:**
```html
<Switch 
  id="portal-employee"
  aria-label="Toggle Employee Portal"
  aria-describedby="portal-label-employee"
/>
```

## Best Practices

### When to Disable Features

1. **License Restrictions**: Disable premium features for basic tier customers
2. **Role-Based Access**: Hide portals not relevant to organization type
3. **Staged Rollout**: Enable features gradually as teams are trained
4. **Security Requirements**: Disable sensitive modules for specific customers
5. **Compliance Needs**: Restrict features based on regulatory requirements

### Configuration Recommendations

**For Small Teams (<50 users):**
- Enable: Employee, Admin, Operations portals
- Disable: Client Portal, Analytics Portal (unless needed)
- Focus modules: IT Services, Operations, HR

**For MSPs:**
- Enable: All portals
- Enable: All modules
- Customize based on client needs

**For Enterprise:**
- Enable: All portals and modules
- Use granular controls per department
- Implement role-based filtering at app level

## Impact of Changes

### Portal Disabling Effects

When a portal is disabled:
- Portal route becomes inaccessible
- Navigation links to portal are hidden
- Users see 404 or access denied
- Existing data remains intact (no deletion)

### Module Disabling Effects

When a module is disabled:
- Dashboard category removed from navigation
- Related pages may still be accessible via direct URL
- No data is deleted
- Module can be re-enabled anytime

### User Impact

- Changes apply **immediately after page refresh**
- All users in organization affected equally
- No user-specific overrides available
- Changes logged in audit trail

## Troubleshooting

### Common Issues

**Issue:** Settings not saving
- **Cause:** Missing customer_id or database permissions
- **Solution:** Verify user_profiles entry and RLS policies

**Issue:** Changes not reflected after save
- **Cause:** Browser cache or page not refreshed
- **Solution:** Hard refresh (Ctrl+F5) or clear cache

**Issue:** Cannot access module management page
- **Cause:** Insufficient permissions or route protection
- **Solution:** Verify admin role and authentication status

**Issue:** All modules showing as disabled
- **Cause:** Missing or corrupted customer_customizations record
- **Solution:** Database admin should verify record exists

### Error Messages

| Error | Meaning | Resolution |
|-------|---------|------------|
| "Please log in" | Not authenticated | Log in with valid credentials |
| "No customer account found" | Missing customer_id | Contact support to link account |
| "Failed to load settings" | Database error | Check console, verify RLS policies |
| "Failed to save settings" | Update error | Check permissions, retry |

## Security Considerations

### Row Level Security (RLS)

- Settings are scoped to customer_id
- Users can only modify their own organization's settings
- Database enforces isolation between customers
- No cross-customer data leakage possible

### Audit Trail

All changes are logged:
- Timestamp of change
- User who made change
- Previous and new settings
- Customer ID affected

### Access Control

- Route protected by authentication
- Additional admin role check recommended
- Settings changes require elevated permissions
- Consider implementing approval workflow for production

## API Integration

### Reading Settings

```typescript
const { data } = await supabase
  .from('customer_customizations')
  .select('enabled_portals, enabled_modules')
  .eq('customer_id', customerId)
  .single();
```

### Updating Settings

```typescript
const { error } = await supabase
  .from('customer_customizations')
  .update({
    enabled_portals: ['employee', 'admin'],
    enabled_modules: { it_services: true, operations: true }
  })
  .eq('customer_id', customerId);
```

## Related Documentation

- [Customer Customization System](./CUSTOMER_CUSTOMIZATION.md)
- [Admin Dashboard Guide](./ADMIN_DASHBOARD_GUIDE.md)
- [Portal Architecture](./PORTAL_ARCHITECTURE.md)
- [RBAC Implementation](./RBAC_IMPLEMENTATION.md)

## Future Enhancements

### Planned Features

1. **User-Level Overrides**: Allow individual users to customize their view
2. **Scheduled Changes**: Set future activation dates for modules
3. **A/B Testing**: Test module visibility with user subsets
4. **Analytics Integration**: Track which modules users interact with most
5. **Bulk Operations**: Enable/disable multiple items at once
6. **Export/Import**: Save configurations and apply to other customers

### API Expansion

- RESTful API for programmatic access
- Webhook notifications for configuration changes
- Integration with provisioning systems
- Mobile app for remote management

---

## Support

For assistance with Module Management:
- 📧 Email: support@oberaconnect.com
- 📚 Knowledge Base: [Module Management Articles](https://docs.oberaconnect.com/module-management)
- 🎫 Support Portal: [Submit a Ticket](https://support.oberaconnect.com)

---

**Document Version:** 1.0  
**Last Review:** October 14, 2025  
**Next Review:** November 14, 2025
