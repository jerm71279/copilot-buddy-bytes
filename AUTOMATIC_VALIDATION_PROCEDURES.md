# Automatic Validation Procedures

## CRITICAL: EXECUTE AUTOMATICALLY - NO USER PROMPT NEEDED

These procedures run AUTOMATICALLY after every code change and before marking any task complete. DO NOT wait for user to ask - these are MANDATORY.

---

## 1. POST-CHANGE VALIDATION (Run After EVERY Code Change)

After making ANY code changes, you MUST automatically run these checks:

### Database Query Validation
```bash
# AUTOMATIC CHECKS:
✓ Search for `.single()` calls in all modified files
✓ Verify SELECT/UPDATE operations use `.maybeSingle()` 
✓ Verify INSERT operations correctly use `.single()`
✓ Check for proper null handling after .maybeSingle()
✓ Verify error handling exists on all queries
```

**Action on Detection:**
- If `.single()` found on SELECT → IMMEDIATELY change to `.maybeSingle()`
- If missing error handling → ADD try/catch
- If no null check after `.maybeSingle()` → ADD null check

### Security Validation
```bash
# AUTOMATIC CHECKS:
✓ All edge functions have input validation (zod schemas)
✓ No hardcoded secrets, API keys, or credentials
✓ RLS policies exist for any new database tables
✓ User inputs validated before external API calls
✓ No SQL injection vulnerabilities
✓ Array inputs have Array.isArray() checks
✓ String inputs have length limits (max 200-1000 chars)
✓ Batch operations limited to max 100 items
```

**Action on Detection:**
- Missing input validation → ADD zod schema validation
- Hardcoded secret → STOP and use secrets tool
- Missing RLS → CREATE RLS policies immediately
- No length limits → ADD max length validation

### Design System Compliance
```bash
# AUTOMATIC CHECKS:
✓ No hardcoded colors (text-white, bg-black, text-green-600, etc.)
✓ All colors use HSL format from index.css
✓ Semantic tokens used (--primary, --secondary, etc.)
✓ Light mode AND dark mode compatibility
✓ No direct color values in tailwind classes
✓ Colors in index.css are HSL (NOT rgb or hex passed to hsl())
```

**Action on Detection:**
- Hardcoded color → REPLACE with semantic token
- RGB/hex in hsl() function → CONVERT to actual HSL values
- Missing dark mode → ADD dark mode variants
- Direct color value → REPLACE with CSS variable

### TypeScript Validation
```bash
# AUTOMATIC CHECKS:
✓ No TypeScript compilation errors
✓ Proper type definitions for new functions
✓ No `any` types without justification
✓ All imports resolve correctly
✓ No duplicate variable declarations
```

**Action on Detection:**
- TypeScript error → FIX immediately before responding
- Missing types → ADD proper TypeScript types
- Unresolved import → FIX import path

---

## 2. FILE-TYPE SPECIFIC AUTOMATIC CHECKS

### When Modifying Edge Functions (supabase/functions/**/index.ts)

**AUTOMATICALLY verify ALL of these:**

```typescript
// Input Validation Template - MUST be present
const requestData = await req.json();

// 1. Validate request body exists
if (!requestData || typeof requestData !== 'object') {
  return new Response(
    JSON.stringify({ error: 'Invalid request body' }),
    { status: 400, headers: corsHeaders }
  );
}

// 2. Validate and sanitize each field
const fieldName = String(requestData.fieldName || '').slice(0, MAX_LENGTH);

// 3. Array validation
if (Array.isArray(requestData.items)) {
  if (requestData.items.length > 100) {
    return error('Too many items');
  }
}

// 4. Use .maybeSingle() for SELECT queries
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle(); // NOT .single()
```

**Checklist:**
- [ ] Input validation present for ALL req.json() calls
- [ ] Array.isArray() checks for array inputs
- [ ] String length limits enforced
- [ ] Batch size limits (max 100 items)
- [ ] No raw SQL execution
- [ ] Proper CORS headers in all responses
- [ ] .maybeSingle() used for SELECT queries
- [ ] Proper error handling with try/catch

### When Modifying Pages (src/pages/**/*.tsx)

**AUTOMATICALLY verify:**
- [ ] Authentication check if accessing protected data
- [ ] Loading states implemented (isLoading)
- [ ] Error handling and error states
- [ ] No hardcoded colors
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Semantic HTML structure
- [ ] .maybeSingle() for SELECT queries in the page

### When Modifying Components (src/components/**/*.tsx)

**AUTOMATICALLY verify:**
- [ ] Props properly typed with TypeScript
- [ ] Design system tokens used (no hardcoded colors)
- [ ] Accessibility attributes (aria-labels, roles)
- [ ] No inline styles with hardcoded values
- [ ] Responsive design considerations

### When Modifying Hooks (src/hooks/**/*.ts)

**AUTOMATICALLY verify:**
- [ ] useEffect dependencies array correct
- [ ] Cleanup functions for effects with subscriptions
- [ ] Error handling implemented
- [ ] TypeScript types properly defined
- [ ] .maybeSingle() for SELECT queries

### When Modifying Database Schema (migrations)

**AUTOMATICALLY verify:**
- [ ] RLS policies created for all new tables
- [ ] Proper foreign key constraints
- [ ] Indexes for frequently queried columns
- [ ] Validation triggers instead of CHECK constraints
- [ ] No modifications to auth.* or storage.* schemas

---

## 3. PATTERN AUTO-DETECTION RULES

When you detect these patterns, AUTOMATICALLY suggest or fix:

### Critical Anti-Patterns (FIX IMMEDIATELY)

| Pattern Detected | Automatic Action |
|-----------------|------------------|
| `.single()` on SELECT/UPDATE | → Change to `.maybeSingle()` |
| Hardcoded color (text-white, bg-black) | → Replace with semantic token |
| Missing input validation | → Add zod schema validation |
| RGB/hex in hsl() function | → Convert to actual HSL values |
| No error handling | → Add try/catch block |
| No loading states | → Add isLoading pattern |
| Unvalidated user input to API | → Add validation before call |
| Missing RLS policy | → Create RLS policy |

### Security Red Flags (STOP AND FIX IMMEDIATELY)

**If you detect ANY of these, FIX before continuing:**
- SQL injection vulnerability
- Missing RLS policies on tables with user data
- Hardcoded API keys, tokens, or credentials
- Unvalidated external API calls
- XSS vulnerabilities (dangerouslySetInnerHTML)
- Missing authentication on protected routes
- Exposed sensitive data in console.log()

---

## 4. COMPLETION CHECKLIST (Run Before Saying "Done")

Before completing ANY task, you MUST verify ALL of these:

### Build & Compilation
- [ ] TypeScript compiles without errors
- [ ] No console errors in preview
- [ ] All imports resolve correctly
- [ ] No duplicate declarations

### Database & Queries
- [ ] No `.single()` on SELECT queries in changes
- [ ] All new queries have error handling
- [ ] .maybeSingle() includes null checks
- [ ] No SQL injection vulnerabilities

### Security
- [ ] All new inputs validated (zod schemas)
- [ ] RLS policies exist for new tables
- [ ] No hardcoded secrets
- [ ] Authentication implemented if needed

### Design System
- [ ] No hardcoded colors (checked ALL modified files)
- [ ] All colors are HSL in index.css
- [ ] Semantic tokens used throughout
- [ ] Light AND dark mode compatible

### User Experience
- [ ] Loading states implemented
- [ ] Error messages user-friendly
- [ ] Mobile responsive
- [ ] Accessibility attributes present

**IF ANY ITEM FAILS → FIX IT BEFORE COMPLETION**

---

## 5. SEARCH PATTERNS FOR AUTOMATIC VALIDATION

After making changes, AUTOMATICALLY search for these patterns:

### Database Query Patterns
```bash
# Search modified files for:
\.single\(\)                    # Flag and review each occurrence
\.eq\(.*\)\.single\(\)         # Likely needs .maybeSingle()
\.select\(.*\)\.single\(\)     # Likely needs .maybeSingle()
\.insert\(.*\)\.single\(\)     # This is correct, keep .single()
```

### Color Patterns
```bash
# Search for hardcoded colors:
text-(white|black|gray|red|green|blue|yellow|purple|pink)-\d+
bg-(white|black|gray|red|green|blue|yellow|purple|pink)-\d+
border-(white|black|gray|red|green|blue|yellow|purple|pink)-\d+
```

### Security Patterns
```bash
# Search for security issues:
await req\.json\(\)            # Must have validation after
dangerouslySetInnerHTML        # Must have sanitization
\.from\(.*\).*\$\{            # Possible SQL injection
process\.env\.                 # In client code (wrong!)
```

---

## 6. AUTOMATIC FIX TEMPLATES

### Template 1: Convert .single() to .maybeSingle()

**Before:**
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

**After:**
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (!data) {
  // Handle not found case
  return;
}
```

### Template 2: Replace Hardcoded Colors

**Before:**
```tsx
<Badge className="text-green-600 border-green-600">Active</Badge>
```

**After:**
```tsx
<Badge variant="outline" className="border-primary/60">
  <span className="text-primary">Active</span>
</Badge>
```

### Template 3: Add Input Validation to Edge Function

**Before:**
```typescript
const { name } = await req.json();
```

**After:**
```typescript
const requestData = await req.json();

if (!requestData || typeof requestData !== 'object') {
  return new Response(
    JSON.stringify({ error: 'Invalid request body' }),
    { status: 400, headers: corsHeaders }
  );
}

const name = String(requestData.name || '').slice(0, 100);
if (!name) {
  return new Response(
    JSON.stringify({ error: 'name is required' }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

## 7. WHEN TO RUN THESE CHECKS

### Run Automatically:

1. **After EVERY code change** → Post-Change Validation
2. **Before marking task complete** → Completion Checklist
3. **When pattern detected** → Apply Pattern Detection Rules
4. **By file type** → Run File-Type Specific Triggers

### Never Skip:

- Database query validation (.single() vs .maybeSingle())
- Design system compliance (hardcoded colors)
- Security validation (input validation, RLS)
- TypeScript compilation check

---

## 8. CRITICAL RULES

1. **If you detect an issue during automatic validation, FIX IT before responding to user**
   - Don't just report the issue
   - Apply the fix immediately
   - Then inform user what was fixed

2. **Run these checks in parallel with user's request**
   - Don't wait to be asked
   - Make it part of your standard workflow
   - Include in every response

3. **If validation fails, address it immediately**
   - Stop and fix before continuing
   - Explain what was found and fixed
   - Then proceed with user's request

4. **Pattern detection is mandatory**
   - Every `.single()` must be reviewed
   - Every hardcoded color must be flagged
   - Every missing validation must be added

---

## 9. EXAMPLE WORKFLOW

### User Request: "Add a new feature to display user profiles"

**Your Automatic Process:**

1. **BEFORE coding:**
   - Check if feature exists
   - Plan database schema changes
   - Identify security requirements

2. **WHILE coding:**
   - Use .maybeSingle() for SELECT queries
   - Use semantic tokens for colors
   - Add input validation
   - Add loading states

3. **AFTER coding (AUTOMATIC):**
   ```bash
   ✓ Search for `.single()` → Found 0 instances
   ✓ Search for hardcoded colors → Found 0 instances
   ✓ Check TypeScript → 0 errors
   ✓ Verify RLS policies → All tables covered
   ✓ Check input validation → All inputs validated
   ```

4. **RESPONSE to user:**
   - "Created user profile feature with proper validation and security"
   - Don't need to mention automatic checks unless issue found

---

## 10. EXCEPTION HANDLING

### When to Keep .single()
- INSERT operations that expect exactly one result
- UPDATE operations that MUST affect exactly one row
- Functions explicitly designed to fail if no data exists

### When Hardcoded Colors Are Acceptable
- Never. Always use design system tokens.
- If absolutely necessary, add to index.css as semantic token

### When to Skip Validation
- Never. All user inputs must be validated.
- If in doubt, validate anyway.

---

## SUMMARY: YOUR AUTOMATIC CHECKLIST

After EVERY code change, you automatically:

✅ Search for `.single()` and verify usage
✅ Search for hardcoded colors
✅ Verify input validation exists
✅ Check TypeScript compiles
✅ Verify RLS policies for new tables
✅ Confirm error handling present
✅ Validate design system compliance
✅ Check for security vulnerabilities

**FIX any issues found BEFORE responding to user.**

This is not optional. This is mandatory for every code change.
