import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions, useResourcePermission } from './usePermissions';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('./useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isLoading: false,
  }),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasPermission).toBe(false);
    expect(typeof result.current.checkPermission).toBe('function');
  });

  it('should check permission successfully', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: true,
      error: null,
    });

    const { result } = renderHook(() => usePermissions());

    const hasAccess = await result.current.checkPermission('compliance', 'view');

    expect(hasAccess).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('has_permission', {
      _user_id: 'user-123',
      _resource_type: 'portal',
      _resource_name: 'compliance',
      _min_permission: 'view',
    });
  });

  it('should return false when permission check fails', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: false,
      error: null,
    });

    const { result } = renderHook(() => usePermissions());

    const hasAccess = await result.current.checkPermission('admin', 'edit');

    expect(hasAccess).toBe(false);
  });

  it('should return false on error', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: new Error('Permission check failed'),
    });

    const { result } = renderHook(() => usePermissions());

    const hasAccess = await result.current.checkPermission('settings', 'admin');

    expect(hasAccess).toBe(false);
  });

  it('should cache permission results', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: true,
      error: null,
    });

    const { result } = renderHook(() => usePermissions());

    // First call
    await result.current.checkPermission('workflows', 'view');
    // Second call (should use cache)
    await result.current.checkPermission('workflows', 'view');

    // Should only call RPC once due to caching
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('should return false when user is not authenticated', async () => {
    vi.mock('./useAuth', () => ({
      useAuth: () => ({
        user: null,
        isLoading: false,
      }),
    }));

    const { result } = renderHook(() => usePermissions());

    const hasAccess = await result.current.checkPermission('anything', 'view');

    expect(hasAccess).toBe(false);
  });

  it('should handle different permission levels', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: true,
      error: null,
    });

    const { result } = renderHook(() => usePermissions());

    await result.current.checkPermission('cmdb', 'view');
    await result.current.checkPermission('cmdb', 'edit');
    await result.current.checkPermission('cmdb', 'admin');

    expect(supabase.rpc).toHaveBeenCalledTimes(3);
  });
});

describe('useResourcePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check resource permission on mount', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: true,
      error: null,
    });

    const { result } = renderHook(() => useResourcePermission('incidents', 'view'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission).toBe(true);
  });

  it('should handle permission denied', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: false,
      error: null,
    });

    const { result } = renderHook(() => useResourcePermission('admin', 'admin'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission).toBe(false);
  });

  it('should re-check when resource or level changes', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: true,
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ resource, level }: { resource: string; level: 'view' | 'edit' | 'admin' }) => 
        useResourcePermission(resource, level),
      { initialProps: { resource: 'workflows', level: 'view' as 'view' | 'edit' | 'admin' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ resource: 'compliance', level: 'edit' as 'view' | 'edit' | 'admin' });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });
  });
});
