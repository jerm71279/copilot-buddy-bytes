# Layout Standards Guide
**Version:** 1.0.0  
**Date:** October 30, 2025  
**Status:** ACTIVE STANDARD

---

## Overview

This document defines the standardized layout patterns for all pages across the platform to ensure consistency, maintainability, and optimal user experience.

---

## Container Width Standards

### Standard Breakpoints

Use these four standard max-width values throughout the application:

#### 1. Full-Width Dashboards - `max-w-7xl` (1280px)
**Use for:**
- Main dashboard pages with metrics and charts
- Portal pages with multiple data sections
- Pages with wide data tables
- Analytics and reporting views

**Examples:**
- Analytics Portal
- Compliance Portal
- SOC Dashboard
- HR Dashboard
- Executive Dashboard

#### 2. Content Pages - `max-w-4xl` (896px)
**Use for:**
- Article/documentation viewers
- Form-heavy pages
- Detail pages with rich content
- Knowledge base articles
- Blog posts

**Examples:**
- Knowledge Article pages
- Documentation viewers
- Content management forms

#### 3. Forms/Narrow Content - `max-w-2xl` (672px)
**Use for:**
- Simple forms
- Upload interfaces
- Single-column content
- Narrow focused tasks

**Examples:**
- File upload pages
- Simple configuration forms
- Single-task interfaces

#### 4. Dialogs/Modals - `max-w-md` to `max-w-4xl`
**Use for:**
- Small dialogs: `max-w-md` (448px)
- Medium dialogs: `max-w-2xl` (672px)
- Large dialogs: `max-w-4xl` (896px)
- Full-screen modals: No max-width

---

## Spacing Standards

### Vertical Spacing

#### Page-Level Spacing
```tsx
<DashboardLayout className="space-y-6">
  {/* Main content */}
</DashboardLayout>
```
**Standard:** Use `space-y-6` for top-level page content

#### Section-Level Spacing
```tsx
<div className="space-y-4">
  <Card>...</Card>
  <Card>...</Card>
</div>
```
**Standard:** Use `space-y-4` for sections and card groups

#### Card-Internal Spacing
```tsx
<CardContent className="space-y-3">
  {/* Card content */}
</CardContent>
```
**Standard:** Use `space-y-3` inside cards

### Horizontal Spacing

#### Grid Gaps
- **Large grids:** `gap-6`
- **Card grids:** `gap-4`
- **Form fields:** `gap-3`

---

## Heading Hierarchy

### Page Headings

#### H1 - Page Title
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
```
**Usage:** Once per page, main page title

#### H2 - Section Heading
```tsx
<h2 className="text-2xl font-semibold">Section Title</h2>
```
**Usage:** Major sections within a page

#### H3 - Subsection Heading
```tsx
<h3 className="text-xl font-semibold">Subsection Title</h3>
```
**Usage:** Subsections and card titles

#### H4 - Minor Heading
```tsx
<h4 className="text-lg font-medium">Minor Title</h4>
```
**Usage:** Form sections, list headers

---

## Standard Page Structures

### Dashboard Layout
```tsx
export default function MyDashboard() {
  return (
    <DashboardLayout className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Title</h1>
        <p className="text-muted-foreground">Dashboard description</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>...</Card>
        <Card>...</Card>
        <Card>...</Card>
        <Card>...</Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview">
        <TabsList>...</TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>...</Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
```

### Portal Layout
```tsx
export default function MyPortal() {
  return (
    <DashboardLayout className="max-w-7xl mx-auto">
      <PageHeader
        title="Portal Title"
        description="Portal description"
        dashboardMenu={{ dashboardName: "Portal Name" }}
      />

      <Tabs defaultValue="main" className="space-y-4">
        <TabsList>...</TabsList>
        <TabsContent value="main" className="space-y-4">
          <Card>...</Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
```

### Content Page Layout
```tsx
export default function MyContentPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Content Title</h1>
          <p className="text-muted-foreground">Content description</p>
        </div>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            {/* Rich content */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### Form Page Layout
```tsx
export default function MyFormPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Title</CardTitle>
            <CardDescription>Form description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form fields */}
          </CardContent>
          <CardFooter>
            <Button>Submit</Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

---

## Dialog Size Standards

### Dialog Component Sizes

```tsx
// Small Dialog - Confirmations, simple forms
<DialogContent className="max-w-md">
  {/* Content */}
</DialogContent>

// Medium Dialog - Standard forms
<DialogContent className="max-w-2xl">
  {/* Content */}
</DialogContent>

// Large Dialog - Complex forms, data views
<DialogContent className="max-w-4xl">
  {/* Content */}
</DialogContent>

// Extra Large Dialog - Rich content
<DialogContent className="max-w-6xl">
  {/* Content */}
</DialogContent>
```

---

## Responsive Patterns

### Mobile-First Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Items */}
</div>
```

### Responsive Containers
```tsx
<div className="container mx-auto px-4 max-w-7xl">
  {/* Content */}
</div>
```

---

## Component Standards

### Card Spacing
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Button Groups
```tsx
<div className="flex gap-2">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

---

## Anti-Patterns to Avoid

### ❌ Don't Use
```tsx
// Custom widths
<div className="max-w-[1234px]">...</div>

// Inconsistent spacing
<div className="space-y-8">...</div> // Too large
<div className="space-y-2">...</div> // Too small for page-level

// Nested containers
<div className="max-w-7xl">
  <div className="max-w-6xl">...</div>
</div>

// Inline max-width on DashboardLayout children
<DashboardLayout>
  <div className="max-w-7xl">...</div> // Apply to DashboardLayout instead
</DashboardLayout>
```

### ✅ Do Use
```tsx
// Standard widths
<div className="max-w-7xl">...</div>

// Consistent spacing
<div className="space-y-6">...</div> // Page-level
<div className="space-y-4">...</div> // Section-level

// Single container
<DashboardLayout className="max-w-7xl mx-auto">
  {/* Direct content */}
</DashboardLayout>
```

---

## Migration Checklist

When updating a page to follow these standards:

- [ ] Apply correct max-width based on page type
- [ ] Use `space-y-6` for page-level spacing
- [ ] Use `space-y-4` for section-level spacing
- [ ] Verify heading hierarchy (h1 → h2 → h3 → h4)
- [ ] Check responsive grid patterns
- [ ] Ensure proper card spacing
- [ ] Validate dialog sizes
- [ ] Remove custom width values
- [ ] Test on mobile/tablet/desktop

---

## Examples by Page Type

### Dashboard Pages
- **Target Width:** `max-w-7xl mx-auto`
- **Examples:** AnalyticsPortal, CompliancePortal, SOCDashboard, HRDashboard

### Detail Pages
- **Target Width:** `max-w-4xl mx-auto`
- **Examples:** Knowledge articles, documentation viewers, item details

### Form Pages
- **Target Width:** `max-w-2xl mx-auto`
- **Examples:** Upload pages, configuration forms, simple workflows

### Full-Width Pages
- **Target Width:** No max-width
- **Examples:** Architecture canvas, diagram tools, visual editors

---

## Enforcement

### Code Review Checklist
- Verify max-width follows standards
- Check spacing consistency
- Validate heading hierarchy
- Ensure responsive patterns

### Automated Checks
- ESLint rules for spacing patterns (future)
- Width validation in tests (future)
- Accessibility audits for heading hierarchy

---

**Document Owner:** Platform Architecture Team  
**Last Updated:** October 30, 2025  
**Next Review:** November 30, 2025
