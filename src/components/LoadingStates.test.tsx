import { render } from '@/lib/test-utils';
import { describe, it, expect } from 'vitest';
import { TableRowSkeleton, CardSkeleton, FormSkeleton } from './LoadingStates';

describe('LoadingStates', () => {
  describe('TableRowSkeleton', () => {
    it('should render default number of columns', () => {
      const { container } = render(<TableRowSkeleton />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      
      // Default is 5 columns
      expect(skeletons.length).toBe(5);
    });

    it('should render custom number of columns', () => {
      const { container } = render(<TableRowSkeleton columns={3} />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      
      expect(skeletons.length).toBe(3);
    });
  });

  describe('CardSkeleton', () => {
    it('should render skeleton card with header and content', () => {
      const { container } = render(<CardSkeleton />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      
      // Should have multiple skeleton elements
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('FormSkeleton', () => {
    it('should render default number of fields', () => {
      const { container } = render(<FormSkeleton />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      
      // Each field has label + input skeleton (default 3 fields = 6 skeletons)
      expect(skeletons.length).toBe(6);
    });

    it('should render custom number of fields', () => {
      const { container } = render(<FormSkeleton fields={2} />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      
      // 2 fields = 4 skeletons (2 labels + 2 inputs)
      expect(skeletons.length).toBe(4);
    });
  });
});
