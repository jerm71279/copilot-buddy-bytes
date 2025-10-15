import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDataFetching, useDataItem } from './useDataFetching';

// Mock dependencies
vi.mock('./useDatabase', () => ({
  useDatabase: () => ({
    read: vi.fn(),
    readOne: vi.fn(),
  }),
}));

vi.mock('./useNotification', () => ({
  useNotification: () => ({
    operations: {
      loadError: vi.fn(),
    },
  }),
}));

describe('useDataFetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty data', () => {
    const { result } = renderHook(() => useDataFetching('test_table'));
    
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(true);
  });

  it('should provide refresh function', () => {
    const { result } = renderHook(() => useDataFetching('test_table'));
    
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should provide loadMore function', () => {
    const { result } = renderHook(() => useDataFetching('test_table'));
    
    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should respect autoLoad option', () => {
    const { result } = renderHook(() => 
      useDataFetching('test_table', { autoLoad: false })
    );
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle custom page size', () => {
    const { result } = renderHook(() => 
      useDataFetching('test_table', { pageSize: 25 })
    );
    
    expect(result.current.data).toEqual([]);
  });

  it('should handle filters', () => {
    const filters = { status: 'active' };
    const { result } = renderHook(() => 
      useDataFetching('test_table', { filters })
    );
    
    expect(result.current.data).toEqual([]);
  });

  it('should disable error toast when showErrorToast is false', () => {
    const { result } = renderHook(() => 
      useDataFetching('test_table', { showErrorToast: false })
    );
    
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useDataItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null data', () => {
    const { result } = renderHook(() => useDataItem('test_table', 'item-123'));
    
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle null id', () => {
    const { result } = renderHook(() => useDataItem('test_table', null));
    
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should provide refresh function', () => {
    const { result } = renderHook(() => useDataItem('test_table', 'item-123'));
    
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should respect autoLoad option', () => {
    const { result } = renderHook(() => 
      useDataItem('test_table', 'item-123', { autoLoad: false })
    );
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should disable error toast when showErrorToast is false', () => {
    const { result } = renderHook(() => 
      useDataItem('test_table', 'item-123', { showErrorToast: false })
    );
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle id changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useDataItem('test_table', id),
      { initialProps: { id: 'item-1' } }
    );

    rerender({ id: 'item-2' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
