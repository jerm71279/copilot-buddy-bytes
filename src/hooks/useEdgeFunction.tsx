import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EdgeFunctionOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface UseEdgeFunctionReturn<TRequest, TResponse> {
  execute: (body: TRequest) => Promise<TResponse | null>;
  loading: boolean;
  error: Error | null;
  data: TResponse | null;
}

/**
 * Generic hook for calling Supabase Edge Functions with consistent error handling
 * 
 * @param functionName - Name of the edge function to call
 * @param options - Configuration options for toasts and messages
 * 
 * @example
 * const { execute, loading, error, data } = useEdgeFunction('my-function', {
 *   showSuccessToast: true,
 *   successMessage: 'Operation completed!'
 * });
 * 
 * const result = await execute({ someParam: 'value' });
 */
export function useEdgeFunction<TRequest = any, TResponse = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
): UseEdgeFunctionReturn<TRequest, TResponse> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResponse | null>(null);

  const execute = useCallback(async (body: TRequest): Promise<TResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        functionName,
        { body }
      );

      if (functionError) {
        throw functionError;
      }

      setData(responseData);

      if (options.showSuccessToast) {
        toast.success(options.successMessage || 'Operation completed successfully');
      }

      return responseData;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);

      if (options.showErrorToast !== false) {
        toast.error(options.errorMessage || errorObj.message || 'Operation failed');
      }

      console.error(`Error calling edge function '${functionName}':`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [functionName, options]);

  return { execute, loading, error, data };
}
