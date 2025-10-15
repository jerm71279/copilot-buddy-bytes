import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('./useNotification', () => ({
  useNotification: () => ({
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('should load authenticated user session', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockProfile = {
      user_id: 'user-123',
      full_name: 'Test User',
      department: 'IT',
      customer_id: 'customer-123',
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });

    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: mockProfile, error: null }),
        }),
      }),
    });

    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.customerId).toBe('customer-123');
  });

  it('should handle missing session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('should handle profile loading error', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: new Error('Profile error') }),
        }),
      }),
    });

    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still set loading to false even with error
    expect(result.current.isLoading).toBe(false);
  });

  it('should provide requireAuth utility', () => {
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.requireAuth).toBe('function');
  });

  it('should provide requireCustomer utility', () => {
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.requireCustomer).toBe('function');
  });

  it('should provide signOut function', () => {
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should provide refresh function', () => {
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.refresh).toBe('function');
  });
});
