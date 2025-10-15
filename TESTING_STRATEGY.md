# Testing Strategy

## Overview
This document outlines the testing strategy for OberaConnect, including unit tests, integration tests, and end-to-end testing approaches.

## Testing Stack
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **Assertions**: Vitest + @testing-library/jest-dom
- **Coverage**: V8 Provider

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## Test Structure

### Unit Tests
Located alongside source files with `.test.ts` or `.test.tsx` extension.

**Example**: `src/hooks/useRetry.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useRetry } from './useRetry';

describe('useRetry', () => {
  it('should succeed on first attempt', async () => {
    const { result } = renderHook(() => useRetry());
    // ... test implementation
  });
});
```

### Component Tests
Test components in isolation with proper providers.

**Example**: `src/components/ErrorBoundary.test.tsx`

```typescript
import { render, screen } from '@/lib/test-utils';
import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    // ... test implementation
  });
});
```

## Test Utilities

### Custom Render
Use the custom render function from `src/lib/test-utils.tsx` to wrap components with necessary providers:

```typescript
import { render } from '@/lib/test-utils';

// Automatically wraps with QueryClientProvider and BrowserRouter
render(<YourComponent />);
```

### Test Setup
Global test setup is configured in `src/lib/test-setup.ts`:
- Extends Vitest with jest-dom matchers
- Automatic cleanup after each test
- Global test configuration

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Coverage Reports
Coverage reports are generated in:
- `coverage/index.html` - HTML report
- `coverage/coverage-final.json` - JSON report
- Terminal output for quick overview

## Best Practices

### 1. Test Behavior, Not Implementation
```typescript
// ❌ Bad - testing implementation details
expect(component.state.count).toBe(1);

// ✅ Good - testing user-visible behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names
```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should retry operation on failure and eventually succeed', () => { ... });
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should update count on button click', () => {
  // Arrange
  render(<Counter />);
  
  // Act
  const button = screen.getByRole('button', { name: /increment/i });
  button.click();
  
  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 4. Mock External Dependencies
```typescript
import { vi } from 'vitest';

const mockOperation = vi.fn().mockResolvedValue('success');
```

### 5. Test Error States
```typescript
it('should handle errors gracefully', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // ... test error handling
  
  consoleSpy.mockRestore();
});
```

## Integration Tests

Integration tests verify that multiple components work together correctly. These are located in `src/__tests__/integration/`.

**Example scenarios**:
- Form submission workflow
- Authentication flow
- Data fetching and display

## E2E Tests

End-to-end tests are documented in:
- `TESTING_PROCEDURES.md` - Manual testing procedures
- `TESTING_GUIDE.md` - System validation and comprehensive testing

## Continuous Integration

Tests run automatically on:
- Every push to any branch
- Every pull request
- Pre-deployment validation

See `.github/workflows/test.yml` for CI configuration.

## Writing New Tests

### For New Hooks
1. Create `[hookName].test.ts` next to the hook
2. Test all success paths
3. Test error conditions
4. Test edge cases
5. Verify cleanup and state management

### For New Components
1. Create `[ComponentName].test.tsx` next to the component
2. Test rendering with different props
3. Test user interactions
4. Test accessibility
5. Test error states

### For New Utilities
1. Create `[utilityName].test.ts` next to the utility
2. Test all public functions
3. Test edge cases and boundary conditions
4. Test error handling

## Debugging Tests

### Run Specific Test File
```bash
npm run test src/hooks/useRetry.test.ts
```

### Run Tests Matching Pattern
```bash
npm run test -- -t "should retry"
```

### Debug in UI Mode
```bash
npm run test:ui
```

### Enable Verbose Output
```bash
npm run test -- --reporter=verbose
```

## Performance Testing

Performance benchmarks are tracked in:
- `TESTING_GUIDE.md` - Performance benchmark targets
- Web Vitals monitoring in production
- Lighthouse CI scores

## Security Testing

Security testing is documented in:
- `TESTING_GUIDE.md` - Security testing procedures
- Input validation fuzzing tests
- RLS policy validation

## Future Improvements

1. **Visual Regression Testing**: Chromatic or Percy integration
2. **Automated E2E**: Playwright or Cypress setup
3. **Performance Budgets**: Automated bundle size checks
4. **Mutation Testing**: Stryker integration
5. **Contract Testing**: API contract validation

## Related Documentation

- [Testing Procedures](./TESTING_PROCEDURES.md)
- [Testing Guide](./public/TESTING_GUIDE.md)
- [Debug Procedures](./DEBUG_PROCEDURES.md)
- [Validation Procedures](./VALIDATION_PROCEDURES.md)
