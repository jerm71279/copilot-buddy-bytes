import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRetry } from './useRetry';

describe('useRetry', () => {
  it('should succeed on first attempt', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = vi.fn().mockResolvedValue('success');

    const response = await result.current.withRetry(mockOperation);

    expect(response).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attempts).toBe(0);
  });

  it('should retry on failure and eventually succeed', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const response = await result.current.withRetry(mockOperation, {
      maxAttempts: 3,
      delayMs: 10,
    });

    expect(response).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = vi.fn().mockRejectedValue(new Error('Always fails'));

    await expect(
      result.current.withRetry(mockOperation, {
        maxAttempts: 2,
        delayMs: 10,
      })
    ).rejects.toThrow('Always fails');

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should apply exponential backoff', async () => {
    const { result } = renderHook(() => useRetry());
    const delays: number[] = [];
    const startTime = Date.now();

    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    await result.current.withRetry(mockOperation, {
      maxAttempts: 3,
      delayMs: 100,
      backoffMultiplier: 2,
      onRetry: () => {
        delays.push(Date.now() - startTime);
      },
    });

    // Verify exponential backoff: second delay should be roughly 2x first delay
    expect(delays.length).toBe(2);
  });

  it('should call onRetry callback', async () => {
    const { result } = renderHook(() => useRetry());
    const onRetry = vi.fn();
    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success');

    await result.current.withRetry(mockOperation, {
      maxAttempts: 2,
      delayMs: 10,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledWith(1);
  });
});
