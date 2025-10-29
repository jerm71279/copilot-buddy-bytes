/**
 * Base Service
 * 
 * Provides standardized error handling and common utilities for all services.
 * All service classes should extend this base or use these utilities.
 */

import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

export interface ServiceError {
  message: string;
  code?: string;
  details?: any;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

/**
 * Base Service Class
 * 
 * Provides common error handling and response formatting
 */
export class BaseService {
  /**
   * Handles Supabase errors and formats them consistently
   */
  protected static handleError(error: PostgrestError | Error | unknown): ServiceError {
    if (error && typeof error === 'object' && 'message' in error) {
      const pgError = error as PostgrestError;
      return {
        message: pgError.message || 'An unknown error occurred',
        code: pgError.code,
        details: pgError.details || pgError
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error
      };
    }
    
    return {
      message: 'An unknown error occurred',
      details: error
    };
  }

  /**
   * Wraps a Supabase query with standardized error handling
   */
  protected static async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
  ): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        };
      }
      
      return {
        data,
        error: null
      };
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err)
      };
    }
  }

  /**
   * Gets the current authenticated user
   */
  protected static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Checks if user is authenticated
   */
  protected static async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }
}

/**
 * Utility functions for services that don't extend BaseService
 */
export const ServiceUtils = {
  handleError: BaseService['handleError'],
  executeQuery: BaseService['executeQuery'],
  getCurrentUser: BaseService['getCurrentUser'],
  isAuthenticated: BaseService['isAuthenticated']
};
