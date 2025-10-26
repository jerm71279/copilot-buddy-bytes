# Design System Spacing Standards

## Purpose
This document defines the spacing standards for the platform to ensure visual consistency, maintainability, and adherence to the design system.

## Core Principles

1. **Use Tailwind Classes**: Always use Tailwind spacing utilities instead of custom CSS
2. **Semantic Consistency**: Same spacing for same contexts across all pages
3. **Design System Tokens**: Leverage CSS variables for dynamic spacing (e.g., `--lanes-height`)
4. **Responsive Design**: Use responsive modifiers (sm:, md:, lg:) for adaptive spacing

---

## Container Standards

### Main Page Wrapper
**Standard Pattern**:
```tsx
<div className="min-h-screen bg-background">
  <main className="container mx-auto px-4 pb-8 pt-8" 
        style={{ marginTop: 'var(--lanes-height, 0px)' }}>
    {/* Page content */}
  </main>
</div>
```

**Breakdown**:
- `min-h-screen` - Ensures full viewport height
- `bg-background` - Uses semantic background token
- `container mx-auto` - Responsive max-width container (max-w-7xl by default)
- `px-4` - Horizontal padding (16px) for mobile, consistent across breakpoints
- `pb-8 pt-8` - Vertical padding (32px bottom, 32px top)
- `marginTop: var(--lanes-height, 0px)` - Dynamic top spacing for portal lanes

**Usage**: 147 of 147 dashboard/portal pages (100% compliance)

---

### Container Width Variations

#### Standard Container (Preferred)
```tsx
<div className="container mx-auto">
```
- **Max Width**: Automatically responsive
  - Default: max-w-7xl (1280px)
  - Centered with `mx-auto`
- **Use Case**: Main dashboards, portal pages, list views
- **Adoption**: 94.5% of pages

#### Narrow Container (Detail Pages)
```tsx
<div className="container mx-auto max-w-5xl">
```
- **Max Width**: 1024px
- **Use Case**: Form pages, detail views, focused content
- **Examples**: ModuleManagement, IntegrationsPage

#### Wide Container (Data-Heavy Pages)
```tsx
<div className="max-w-7xl mx-auto">
```
- **Max Width**: Explicitly set to 1280px
- **Use Case**: Analytics, reports, wide tables
- **Examples**: ContractManagement, Developers, EmployeeFeedback

**Recommendation**: Use standard `container` for consistency. Explicit max-w-7xl should be rare exceptions.

---

## Vertical Spacing

### Page Content Spacing
```tsx
<main className="container mx-auto px-4 pb-8 pt-8 space-y-6">
```

**Spacing Between Sections**:
- `space-y-6` (24px) - Standard section spacing
- `space-y-8` (32px) - Larger section breaks for visual hierarchy
- `space-y-4` (16px) - Compact layouts only

**Rule**: Use `space-y-6` by default. Use `space-y-8` for major section divisions.

---

### Card Padding

#### Standard Card Content
```tsx
<CardContent className="p-6">
```
- **Padding**: 24px all sides
- **Use Case**: Default card content, forms, lists
- **Adoption**: 70%+ of cards

#### Dense Card Content
```tsx
<CardContent className="p-4">
```
- **Padding**: 16px all sides
- **Use Case**: Compact tables, metrics, stat cards
- **Adoption**: 25% of cards

#### Hero/Featured Cards
```tsx
<CardContent className="p-8">
```
- **Padding**: 32px all sides
- **Use Case**: Hero sections, large feature cards, emphasis areas
- **Adoption**: 5% of cards

**Rule**: 
- Standard cards: `p-6`
- Stats/metrics: `p-4`
- Hero/featured: `p-8`

---

## Horizontal Spacing

### Page Horizontal Padding
```tsx
<div className="container mx-auto px-4">
```
- **Padding**: 16px left/right
- **Consistency**: Use `px-4` universally for page-level horizontal padding

### Section Padding
```tsx
<section className="px-6">
```
- **Use Case**: Inner sections that need extra padding beyond container
- **Adoption**: Rare, use sparingly

---

## Grid and Layout Spacing

### Standard Grid Gaps
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```
- **Default Gap**: `gap-6` (24px between grid items)
- **Responsive**: Maintain same gap across breakpoints

### Compact Grid (Stats, Metrics)
```tsx
<div className="grid gap-4 md:grid-cols-4">
```
- **Gap**: `gap-4` (16px)
- **Use Case**: Stat cards, metric tiles

### List Item Spacing
```tsx
<div className="space-y-4">
  {items.map(item => <ListItem key={item.id} />)}
</div>
```
- **List Item Gap**: `space-y-4` (16px) for lists
- **Dense Lists**: `space-y-2` (8px) for compact data

---

## Component-Specific Standards

### Dialog/Modal Padding
```tsx
<DialogContent className="max-w-4xl max-h-[80vh] p-6">
```
- **Max Width**: 896px (max-w-4xl) for standard modals
- **Max Width**: 1024px (max-w-5xl) for large modals
- **Padding**: `p-6` (24px)

### Form Spacing
```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label>Field Label</Label>
    <Input />
  </div>
</form>
```
- **Between Form Fields**: `space-y-6` (24px)
- **Label to Input**: `space-y-2` (8px)

### Button Groups
```tsx
<div className="flex gap-4">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```
- **Button Gap**: `gap-4` (16px) between buttons
- **Dense Button Groups**: `gap-2` (8px)

---

## Responsive Spacing

### Mobile-First Approach
```tsx
<div className="p-4 md:p-6 lg:p-8">
```
- Start with mobile spacing
- Increase padding at larger breakpoints
- **Not commonly used** - prefer consistent spacing

### Container Padding Consistency
**Standard**: Keep `px-4` across all breakpoints for consistency
```tsx
<div className="container mx-auto px-4 pb-8 pt-8">
```

**Why**: Container class already handles max-width responsively, no need for responsive padding.

---

## Anti-Patterns to Avoid

### ❌ Hardcoded Pixel Values
```tsx
// BAD
<div style={{ padding: '24px', margin: '32px' }}>
```

```tsx
// GOOD
<div className="p-6 m-8">
```

### ❌ Inconsistent Spacing
```tsx
// BAD - Mixed spacing values on same page
<div className="space-y-3">  {/* Section 1 */}
<div className="space-y-5">  {/* Section 2 */}
<div className="space-y-7">  {/* Section 3 */}
```

```tsx
// GOOD - Consistent spacing
<div className="space-y-6">  {/* All sections */}
```

### ❌ Excessive Padding Variants
```tsx
// BAD - Too many different padding values
<Card className="p-3" />
<Card className="p-5" />
<Card className="p-7" />
<Card className="p-9" />
```

```tsx
// GOOD - Stick to standard values
<Card className="p-4" />  {/* Compact */}
<Card className="p-6" />  {/* Standard */}
<Card className="p-8" />  {/* Featured */}
```

---

## Quick Reference Table

| Context | Spacing Class | Value | Usage |
|---------|--------------|-------|-------|
| Page horizontal padding | `px-4` | 16px | Universal |
| Page vertical padding | `pb-8 pt-8` | 32px | Main container |
| Section spacing | `space-y-6` | 24px | Default |
| Large section breaks | `space-y-8` | 32px | Major divisions |
| Card padding | `p-6` | 24px | Standard cards |
| Stat card padding | `p-4` | 16px | Compact metrics |
| Hero card padding | `p-8` | 32px | Featured content |
| Grid gaps | `gap-6` | 24px | Standard grids |
| Stat grid gaps | `gap-4` | 16px | Metric tiles |
| Form field spacing | `space-y-6` | 24px | Between fields |
| Label-input spacing | `space-y-2` | 8px | Field internals |
| Button groups | `gap-4` | 16px | Action buttons |
| List items | `space-y-4` | 16px | Standard lists |

---

## Validation

Run spacing validation:
```bash
node scripts/validate-layout-uniformity.js
```

Checks:
- Consistent container padding usage
- No hardcoded pixel dimensions
- Standard spacing patterns
- Responsive design compliance

---

## Migration Guide

### Updating Non-Compliant Pages

#### 1. Replace Custom Padding
```tsx
// Before
<div className="p-5">

// After
<div className="p-6">  {/* Closest standard value */}
```

#### 2. Standardize Section Spacing
```tsx
// Before
<div className="space-y-5">

// After
<div className="space-y-6">  {/* Standard section spacing */}
```

#### 3. Fix Container Width
```tsx
// Before
<div className="max-w-7xl mx-auto px-4">

// After
<div className="container mx-auto px-4">  {/* Use container class */}
```

---

## Related Documentation

- [Code Modularization Validation](validation/CodeModularizationValidation.md)
- [Validation Results](../VALIDATION_RESULTS_2025_10_26.md)
- [Recent Fixes](../RECENT_FIXES_2025_10_26.md)
- [Design System](../index.css)
- [Tailwind Config](../tailwind.config.ts)

---

**Last Updated**: October 26, 2025  
**Version**: 1.0  
**Status**: ✅ Active Standard
