import { useState, useCallback } from 'react';
import { useNotification } from './useNotification';
import { toast } from './use-toast';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Retry Hook with Exponential Backoff
 * Automatically retries failed operations with configurable delays
 */
export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const notify = useNotification();

  const withRetry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
        onRetry,
      } = options;

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setAttempts(attempt);
          setIsRetrying(attempt > 1);

          const result = await operation();
          
          // Success - reset state
          setIsRetrying(false);
          setAttempts(0);
          return result;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < maxAttempts) {
            // Calculate exponential backoff delay
            const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
            
            onRetry?.(attempt);
            console.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, error);
            
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All attempts failed
      setIsRetrying(false);
      setAttempts(0);
      
      notify.error(
        lastError?.message || 'Operation failed after multiple attempts'
      );
      
      throw lastError;
    },
    [notify]
  );

  return {
    withRetry,
    isRetrying,
    attempts,
  };
}
