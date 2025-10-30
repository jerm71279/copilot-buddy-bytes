import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EdgeFunctionOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export interface EdgeFunctionState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Base hook for invoking Supabase edge functions with standardized error handling
 * and loading states. Use this for one-off invocations or as a base for domain-specific hooks.
 */
export function useEdgeFunction<TInput = any, TOutput = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
) {
  const [state, setState] = useState<EdgeFunctionState<TOutput>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const invoke = useCallback(
    async (body: TInput): Promise<TOutput | null> => {
      setState({ data: null, isLoading: true, error: null });

      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body,
        });

        if (error) throw error;

        setState({ data, isLoading: false, error: null });

        if (options.showSuccessToast) {
          toast.success(options.successMessage || 'Operation completed successfully');
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setState({ data: null, isLoading: false, error });

        if (options.showErrorToast !== false) {
          toast.error(options.errorMessage || error.message);
        }

        return null;
      }
    },
    [functionName, options.showSuccessToast, options.showErrorToast, options.successMessage, options.errorMessage]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    invoke,
    reset,
  };
}
