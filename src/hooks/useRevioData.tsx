import { useState, useEffect } from 'react';
import { RevioDataResponse } from '@/types/revio';
import { toast } from 'sonner';
import { useEdgeFunction } from '@/hooks/useEdgeFunction';

export const useRevioData = () => {
  const [data, setData] = useState<RevioDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const revioDataFn = useEdgeFunction('revio-data', { showErrorToast: false });

  const fetchRevioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const responseData = await revioDataFn.execute({ dataType: 'all' });

      if (!responseData) {
        throw new Error('Failed to fetch Revio data');
      }

      if (responseData?.success) {
        setData(responseData.data);
        
        // Show info toast if using placeholder data
        if (responseData.message?.includes('placeholder')) {
          console.log('Using Revio placeholder data - actual integration pending');
        }
      } else {
        throw new Error(responseData?.error || 'Failed to fetch Revio data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Revio data';
      setError(errorMessage);
      console.error('Revio data fetch error:', err);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevioData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchRevioData
  };
};
