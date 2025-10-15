import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMemoizedValue, useMemoizedCallback } from './memoization';

describe('memoization utilities', () => {
  describe('useMemoizedValue', () => {
    it('should memoize expensive computation', () => {
      const expensiveFn = vi.fn((num: number) => num * 2);
      const { result, rerender } = renderHook(
        ({ value }) => useMemoizedValue(() => expensiveFn(value), [value]),
        { initialProps: { value: 5 } }
      );

      expect(result.current).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);

      // Rerender with same value - should not recalculate
      rerender({ value: 5 });
      expect(result.current).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);

      // Rerender with new value - should recalculate
      rerender({ value: 10 });
      expect(result.current).toBe(20);
      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });

    it('should handle complex objects', () => {
      const complexFn = vi.fn((obj: { x: number; y: number }) => obj.x + obj.y);
      const { result, rerender } = renderHook(
        ({ obj }) => useMemoizedValue(() => complexFn(obj), [obj.x, obj.y]),
        { initialProps: { obj: { x: 1, y: 2 } } }
      );

      expect(result.current).toBe(3);
      expect(complexFn).toHaveBeenCalledTimes(1);

      rerender({ obj: { x: 1, y: 2 } });
      expect(complexFn).toHaveBeenCalledTimes(1);

      rerender({ obj: { x: 2, y: 3 } });
      expect(result.current).toBe(5);
      expect(complexFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useMemoizedCallback', () => {
    it('should memoize callback function', () => {
      const callback = vi.fn((x: number) => x * 2);
      const { result, rerender } = renderHook(
        ({ dep }) => useMemoizedCallback((x: number) => callback(x) + dep, [dep]),
        { initialProps: { dep: 5 } }
      );

      const memoizedFn = result.current;
      expect(memoizedFn(10)).toBe(25);
      expect(callback).toHaveBeenCalledWith(10);

      // Rerender with same dependency - should return same function reference
      rerender({ dep: 5 });
      expect(result.current).toBe(memoizedFn);

      // Rerender with new dependency - should return new function
      rerender({ dep: 10 });
      expect(result.current).not.toBe(memoizedFn);
      expect(result.current(10)).toBe(30);
    });

    it('should handle multiple parameters', () => {
      const callback = vi.fn((a: number, b: number, c: string) => `${a + b}-${c}`);
      const { result } = renderHook(() =>
        useMemoizedCallback((a: number, b: number, c: string) => callback(a, b, c), [])
      );

      expect(result.current(1, 2, 'test')).toBe('3-test');
      expect(callback).toHaveBeenCalledWith(1, 2, 'test');
    });

    it('should preserve function identity when dependencies unchanged', () => {
      const { result, rerender } = renderHook(
        ({ multiplier }) => useMemoizedCallback((x: number) => x * multiplier, [multiplier]),
        { initialProps: { multiplier: 2 } }
      );

      const firstRef = result.current;
      
      rerender({ multiplier: 2 });
      expect(result.current).toBe(firstRef);
      
      rerender({ multiplier: 3 });
      expect(result.current).not.toBe(firstRef);
    });
  });
});
