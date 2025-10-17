import { useState, useEffect, useCallback } from 'react';
import { Vendor, CreateVendorInput } from '@/types/vendor';
import { VendorService } from '@/services/vendorService';

interface UseVendorsReturn {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  selectedVendorId: string;
  selectedVendor: Vendor | null;
  setSelectedVendorId: (id: string) => void;
  reloadVendors: () => Promise<void>;
  createVendor: (input: CreateVendorInput, customerId: string, userId: string) => Promise<Vendor>;
}

/**
 * Custom hook for managing vendor state and operations
 */
export function useVendors(customerId?: string): UseVendorsReturn {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  const loadVendors = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await VendorService.getActiveVendors(customerId);
      setVendors(data);

      // Auto-select first vendor if none selected
      if (data.length > 0 && !selectedVendorId) {
        setSelectedVendorId(data[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vendors';
      setError(message);
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId, selectedVendorId]);

  const reloadVendors = useCallback(async () => {
    await loadVendors();
  }, [loadVendors]);

  const createVendor = useCallback(async (
    input: CreateVendorInput,
    customerId: string,
    userId: string
  ): Promise<Vendor> => {
    const vendor = await VendorService.createVendor(input, customerId, userId);
    await reloadVendors();
    setSelectedVendorId(vendor.id);
    return vendor;
  }, [reloadVendors]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const selectedVendor = vendors.find(v => v.id === selectedVendorId) || null;

  return {
    vendors,
    loading,
    error,
    selectedVendorId,
    selectedVendor,
    setSelectedVendorId,
    reloadVendors,
    createVendor,
  };
}
