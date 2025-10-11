# Input Validation System

## Overview

This platform implements comprehensive input validation to protect against:
- SQL Injection attacks
- Cross-Site Scripting (XSS) attacks
- Path Traversal attacks
- Buffer Overflow attempts
- Format String attacks
- Template Injection
- Null Byte attacks

## Validation Layers

### 1. Client-Side Validation

**Location**: `src/lib/inputValidation.ts`

Import and use validation functions in your React components:

```typescript
import { sanitizeString, validateEmail, validateUrl } from '@/lib/inputValidation';

// Validate and sanitize a string
const result = sanitizeString(userInput, 500);
if (!result.isValid) {
  console.error('Validation errors:', result.errors);
  return;
}

// Use the sanitized value
const safeValue = result.sanitized;
```

**Available Functions**:
- `sanitizeString(input, maxLength)` - Validates and sanitizes text input
- `validateEmail(email)` - Validates email format
- `validateUrl(url)` - Validates and sanitizes URLs
- `sanitizeArray(array, maxLength, maxItemLength)` - Validates arrays
- `validateNumber(input, min, max)` - Validates numeric input
- `validateFileName(fileName)` - Validates file names for path traversal
- `validateFields(fields)` - Batch validate multiple fields

### 2. React Component Validation

**Component**: `src/components/ValidatedInput.tsx`

Use the validated input component for automatic real-time validation:

```typescript
import { ValidatedInput } from '@/components/ValidatedInput';

<ValidatedInput
  type="text"
  value={title}
  onChange={setTitle}
  maxLength={200}
  placeholder="Enter title"
  showValidation={true}
/>
```

**Props**:
- `type`: 'text' | 'email' | 'url' | 'textarea'
- `value`: Current input value
- `onChange`: Callback when value changes
- `maxLength`: Maximum character count
- `showValidation`: Show validation messages (default: true)

### 3. Edge Function Validation

**Example**: `supabase/functions/input-validation-example/index.ts`

All edge functions should validate inputs before processing:

```typescript
import { sanitizeString } from './validation.ts';

const { title, content } = await req.json();

// Validate title
const titleValidation = sanitizeString(title, 200);
if (!titleValidation.isValid) {
  return new Response(
    JSON.stringify({ error: 'Invalid title', details: titleValidation.errors }),
    { status: 400 }
  );
}

// Use sanitized value
const safeTitle = titleValidation.sanitized;
```

### 4. Database-Level Validation

**Migration**: `20251011-155231-694319`

Database triggers automatically validate data before insertion/update:

**Protected Tables**:
- `knowledge_articles` - Title, content, tags validation
- `evidence_files` - File name (path traversal), description validation
- `workflows` - Workflow name, description validation
- `audit_logs` - System name, action type, tags validation
- `user_profiles` - Full name, department validation

**Database Functions**:
- `validate_text_input(text, max_length, field_name)` - Validates text fields
- `validate_array_input(array, max_items, max_item_length, field_name)` - Validates arrays

Database validation will raise exceptions if malicious patterns are detected:
```sql
ERROR: title contains suspicious SQL patterns
ERROR: file_name contains path traversal sequences
ERROR: tags exceeds maximum of 20 items
```

## Security Patterns Detected

### SQL Injection
```
'; DROP TABLE users; --
1' OR '1'='1
admin'--
1' UNION SELECT NULL--
```

### XSS (Cross-Site Scripting)
```html
<script>alert('XSS')</script>
<img src=x onerror=alert(1)>
javascript:alert('XSS')
<svg/onload=alert(1)>
```

### Path Traversal
```
../../etc/passwd
../../../../../etc/passwd
..\..\..\windows\system32
```

### Format String Attacks
```
%s%s%s%s
%x%x%x%x
%n%n%n%n
```

### Template Injection
```
{{7*7}}
${7*7}
#{7*7}
```

### Null Bytes
```
\x00\x00\x00
\u0000
%00
```

## Validation Response Format

All validation functions return a consistent format:

```typescript
interface ValidationResult {
  isValid: boolean;      // Overall validation status
  sanitized: string;     // Cleaned/safe version of input
  errors: string[];      // Critical errors that block submission
}
```

## Best Practices

### 1. Always Validate User Input
```typescript
// ❌ BAD - Direct use of user input
await supabase.from('articles').insert({ title: userInput });

// ✅ GOOD - Validate first
const validation = sanitizeString(userInput, 200);
if (validation.isValid) {
  await supabase.from('articles').insert({ title: validation.sanitized });
}
```

### 2. Use Appropriate Max Lengths
```typescript
// Short identifiers
const username = sanitizeString(input, 50);

// Titles and names
const title = sanitizeString(input, 200);

// Descriptions
const description = sanitizeString(input, 2000);

// Long content
const content = sanitizeString(input, 50000);
```

### 3. Validate Arrays
```typescript
// ❌ BAD - No array validation
await supabase.from('logs').insert({ tags: userTags });

// ✅ GOOD - Validate array
const validation = sanitizeArray(userTags, 20, 50);
if (validation.isValid) {
  await supabase.from('logs').insert({ tags: validation.sanitized });
}
```

### 4. Handle Validation Errors
```typescript
const validation = sanitizeString(input);

if (!validation.isValid) {
  toast.error('Invalid input: ' + validation.errors.join(', '));
  return;
}

// Show warnings for non-critical issues
if (validation.errors.length > 0) {
  console.warn('Input warnings:', validation.errors);
}
```

### 5. Use ValidatedInput Component
```typescript
// ❌ BAD - Plain input without validation
<Input value={email} onChange={(e) => setEmail(e.target.value)} />

// ✅ GOOD - Validated input with real-time feedback
<ValidatedInput
  type="email"
  value={email}
  onChange={setEmail}
  showValidation={true}
/>
```

## Testing Validation

Run the input fuzzer to test validation effectiveness:

1. Navigate to `/testing-dashboard`
2. Click "Run Security Fuzz Tests"
3. Review vulnerabilities found
4. Check "Passed" tests to verify validation is working

**Expected Results After Implementation**:
- SQL Injection attempts: REJECTED ✓
- XSS attempts: SANITIZED or REJECTED ✓
- Path traversal: REJECTED ✓
- Buffer overflow: REJECTED ✓
- Format strings: SANITIZED ✓

## Monitoring

### Edge Function Logs
Check edge function logs for validation warnings:
```
Title validation warnings: ["XSS pattern detected and escaped"]
Content validation warnings: ["Input truncated to 10000 characters"]
```

### Database Logs
Monitor PostgreSQL logs for validation errors:
```
ERROR: title contains suspicious SQL patterns
ERROR: tags exceeds maximum of 20 items
```

### Application Logs
Client-side validation warnings appear in browser console:
```javascript
console.warn('Input warnings:', validation.errors);
```

## Troubleshooting

### False Positives
If legitimate input is being blocked:

1. Check validation rules in `src/lib/inputValidation.ts`
2. Adjust regex patterns if needed
3. Consider adding exceptions for specific use cases
4. Update database validation functions if needed

### Performance Issues
If validation slows down forms:

1. Debounce validation calls
2. Use `showValidation={false}` for non-critical fields
3. Move validation to submit handler instead of onChange
4. Optimize regex patterns

### Bypassing Validation (Development Only)
Never bypass validation in production! For testing:

```typescript
// Temporarily disable client-side validation
const validation = { isValid: true, sanitized: input, errors: [] };

// Note: Database validation still applies!
```

## Security Considerations

1. **Defense in Depth**: Multiple validation layers protect even if one fails
2. **Database Validation**: Final protection layer that cannot be bypassed
3. **Sanitization vs Rejection**: Some attacks are sanitized, others rejected entirely
4. **Logging**: All validation failures should be logged for security monitoring
5. **Updates**: Keep validation patterns updated as new attack vectors emerge

## Related Files

- `/src/lib/inputValidation.ts` - Client-side validation library
- `/src/components/ValidatedInput.tsx` - Validated input component
- `/supabase/functions/input-validation-example/index.ts` - Edge function example
- `/supabase/migrations/*` - Database validation triggers
- `/src/pages/ComprehensiveTestDashboard.tsx` - Security testing interface
