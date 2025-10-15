# AI Work Procedures Checklist

This document defines the step-by-step procedures to follow for **every** code change or feature request.

## Pre-Work Phase

### 1. Understand the Request
- [ ] Read the user's request carefully
- [ ] Identify what they're ACTUALLY asking for (not assumptions)
- [ ] Determine if clarification is needed before proceeding
- [ ] Check if the feature/fix already exists
- [ ] Assess scope: is this a small change or does it need breaking down?

### 2. Check Existing Context
- [ ] Review `useful-context` section FIRST - never read files already provided
- [ ] Check current route and view information
- [ ] Review relevant documentation files (VALIDATION_PROCEDURES.md, etc.)
- [ ] Search for similar patterns in codebase if needed
- [ ] Check console logs/network requests if debugging

### 3. Plan the Approach
- [ ] List all files that will need to be created
- [ ] List all files that will need to be modified
- [ ] Identify which tools to use (lov-line-replace vs lov-write)
- [ ] Plan for parallel operations where possible
- [ ] Consider if refactoring is needed for cleaner code

## Implementation Phase

### 4. Efficient Tool Usage
- [ ] Use `lov-line-replace` for most edits (preferred over lov-write)
- [ ] Batch multiple file reads in one operation when possible
- [ ] Make parallel tool calls for independent operations
- [ ] Use search patterns efficiently (include enough context, use ellipsis for large sections)
- [ ] Never rewrite entire files when line-replace will work

### 5. Code Changes
- [ ] Make ONLY the changes requested (no scope creep)
- [ ] Follow design system guidelines (use semantic tokens, not hardcoded colors)
- [ ] Ensure TypeScript types are correct
- [ ] Keep functions focused and maintainable
- [ ] Add proper error handling
- [ ] Consider edge cases only if explicitly requested

### 6. Security Validation (for Edge Functions)
- [ ] Replace `.single()` with `.maybeSingle()` where appropriate
- [ ] Add comprehensive input validation for `req.json()` calls
- [ ] Validate array inputs with `Array.isArray()`
- [ ] Enforce batch size limits (max 100 items)
- [ ] Add string length limits (operationName: 200, resourceName: 100, etc.)
- [ ] Add type checking for all extracted fields
- [ ] Handle null/undefined returns gracefully
- [ ] Never execute raw SQL in edge functions

### 7. Design System Compliance (for UI Components)
- [ ] No hardcoded color classes (text-green-600, border-blue-500, etc.)
- [ ] Use semantic tokens from index.css and tailwind.config.ts
- [ ] All colors must be HSL format
- [ ] Support both light and dark modes
- [ ] Use design system variants (Button, Badge, Alert variants)
- [ ] Consistent spacing using design tokens
- [ ] Proper semantic HTML structure

## Post-Implementation Phase

### 8. Build Verification
- [ ] Check for TypeScript errors
- [ ] Fix any compilation errors immediately
- [ ] Verify no duplicate variable declarations
- [ ] Ensure all imports are correct

### 9. Pattern Propagation
- [ ] Search codebase for similar patterns that need the same fix
- [ ] Apply fixes consistently across all occurrences
- [ ] Document any remaining technical debt

### 10. Documentation Updates
- [ ] Update RECENT_FIXES_2025_10_15.md with changes made
- [ ] Update VALIDATION_PROCEDURES.md with progress
- [ ] Update consolidated_DOCUMENTATION_STATUS.md
- [ ] Update any feature-specific documentation
- [ ] Update API_REFERENCE.md if edge functions changed

### 11. Final Response
- [ ] Provide concise summary of changes (1-2 sentences max)
- [ ] No emojis unless celebrating major milestone
- [ ] Mention if additional work is recommended
- [ ] Ask for confirmation if next steps are unclear

## Special Cases

### For Database Migrations
- [ ] Use `supabase--migration` tool for ALL database changes
- [ ] Include complete SQL with RLS policies
- [ ] Never edit types.ts or client.ts (auto-generated)
- [ ] Wait for user approval before proceeding with code changes
- [ ] Implement authentication if RLS policies are added

### For Refactoring
- [ ] List all files to be created BEFORE making changes
- [ ] Maintain EXACT same functionality
- [ ] Delete old code paths after new ones work
- [ ] Clean up dead code
- [ ] Test that refactored code works identically to original

### For Visual Changes
- [ ] Consider suggesting Visual Edits feature for simple changes
- [ ] Make requested changes first
- [ ] Educate user about Visual Edits for future
- [ ] Link to Visual Edits documentation

### For Debugging
- [ ] Use debugging tools FIRST (logs, network, context)
- [ ] Analyze output before making changes
- [ ] Search codebase for relevant files
- [ ] If stuck, search web for specific error
- [ ] Add console.log if needed for investigation

## Critical Rules (NEVER VIOLATE)

### Efficiency
- ❌ NEVER read files already in useful-context
- ❌ NEVER make sequential tool calls that can be parallel
- ❌ NEVER use lov-write when lov-line-replace works
- ❌ NEVER ask user for data you can get yourself (logs, etc.)

### Security
- ❌ NEVER use `.single()` without null checking
- ❌ NEVER skip input validation on edge functions
- ❌ NEVER execute raw SQL in edge functions
- ❌ NEVER hardcode secrets or credentials

### Design
- ❌ NEVER use hardcoded colors (text-white, bg-black, etc.)
- ❌ NEVER ignore light/dark mode compatibility
- ❌ NEVER create non-responsive designs
- ❌ NEVER skip semantic HTML structure

### Scope
- ❌ NEVER add features not explicitly requested
- ❌ NEVER over-engineer with unnecessary fallbacks
- ❌ NEVER change unrelated functionality
- ❌ NEVER assume what user wants without asking

## Success Metrics

### Code Quality
- Zero TypeScript errors
- Zero hardcoded colors in new/modified components
- All edge functions have input validation
- All database queries use `.maybeSingle()` appropriately

### Efficiency
- Maximum use of parallel operations
- Minimum number of tool calls
- Proper use of line-replace over full file writes
- No unnecessary file reads

### Communication
- Responses under 2 lines (unless detail requested)
- Clear, actionable summaries
- No emojis (except for major milestones)
- Proper use of action links when relevant

## Quick Reference: Common Patterns

### Input Validation Template
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

### Database Query Template
```typescript
const { data: record, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle();

if (!record) {
  return new Response(
    JSON.stringify({ error: 'Record not found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Design System Template
```tsx
// ❌ WRONG - Hardcoded colors
<Badge className="text-green-600 border-green-600">Active</Badge>

// ✅ CORRECT - Semantic tokens
<Badge variant="outline" className="border-primary/60">
  <span className="text-primary">Active</span>
</Badge>
```

## Version History
- 2025-10-15: Initial checklist created
- Document should be updated as procedures evolve

---

**Remember: This checklist exists to ensure consistent, high-quality work. Reference it before, during, and after every task.**
