import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce, useThrottle } from './performance';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    expect(result.current).toBe('initial');

    // Update value multiple times quickly
    rerender({ value: 'update1', delay: 100 });
    rerender({ value: 'update2', delay: 100 });
    rerender({ value: 'update3', delay: 100 });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Wait for debounce delay
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Value should now be the last update
    expect(result.current).toBe('update3');
  });

  it('should use default delay of 500ms', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Should still be initial before delay
    expect(result.current).toBe('initial');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(result.current).toBe('updated');
  });
});

describe('useThrottle', () => {
  it('should throttle function calls', async () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 100));

    // Call multiple times quickly
    act(() => {
      result.current('call1');
      result.current('call2');
      result.current('call3');
    });

    // Only first call should execute immediately
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call1');

    // Wait for throttle delay
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Can call again after delay
    act(() => {
      result.current('call4');
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('call4');
  });
});
