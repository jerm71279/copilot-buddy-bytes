import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeString, sanitizeArray, validateNumber } from "@/lib/inputValidation";

/**
 * Centralized Database Operations Hook
 * Provides CRUD operations with built-in validation, error handling, and notifications
 * Single source of truth for all database interactions
 */

export interface DatabaseOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  validateInput?: boolean;
}

export interface QueryOptions {
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

const DEFAULT_OPTIONS: DatabaseOptions = {
  showSuccessToast: true,
  showErrorToast: true,
  validateInput: true,
};

/**
 * Main database hook - provides type-safe CRUD operations
 * Note: Uses any for table operations to work with dynamic table names
 */
export function useDatabase<T extends Record<string, any>>(tableName: string) {
  const { toast } = useToast();

  /**
   * Validate and sanitize input data
   */
  const validateData = (data: Partial<T>): { isValid: boolean; sanitized: Partial<T>; errors: string[] } => {
    const errors: string[] = [];
    const sanitized: Partial<T> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        sanitized[key as keyof T] = value as any;
        continue;
      }

      // String validation
      if (typeof value === 'string') {
        const result = sanitizeString(value, 5000);
        if (!result.isValid) {
          errors.push(`${key}: ${result.errors.join(', ')}`);
        } else {
          sanitized[key as keyof T] = result.sanitized as any;
        }
      }
      // Array validation
      else if (Array.isArray(value)) {
        if (value.every(v => typeof v === 'string')) {
          const result = sanitizeArray(value as string[], 100, 1000);
          if (!result.isValid) {
            errors.push(`${key}: ${result.errors.join(', ')}`);
          } else {
            sanitized[key as keyof T] = result.sanitized as any;
          }
        } else {
          sanitized[key as keyof T] = value as any;
        }
      }
      // Number validation
      else if (typeof value === 'number') {
        const result = validateNumber(value);
        if (!result.isValid) {
          errors.push(`${key}: ${result.errors.join(', ')}`);
        } else {
          sanitized[key as keyof T] = result.value as any;
        }
      }
      // Other types pass through
      else {
        sanitized[key as keyof T] = value as any;
      }
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  };

  /**
   * Create a new record
   */
  const create = async (
    data: Partial<T>,
    options: DatabaseOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Validate input if enabled
      if (opts.validateInput) {
        const validation = validateData(data);
        if (!validation.isValid) {
          const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
          if (opts.showErrorToast) {
            toast({
              title: "Validation Error",
              description: validation.errors.join(', '),
              variant: "destructive",
            });
          }
          return { data: null, error };
        }
        data = validation.sanitized;
      }

      const { data: result, error } = await supabase
        .from(tableName as any)
        .insert(data as any)
        .select()
        .maybeSingle();

      if (error || !result) throw error || new Error("Failed to insert record");

      if (opts.showSuccessToast) {
        toast({
          title: "Success",
          description: opts.successMessage || "Record created successfully",
        });
      }

      return { data: result as unknown as T, error: null };
    } catch (error) {
      const err = error as Error;
      if (opts.showErrorToast) {
        toast({
          title: "Error",
          description: opts.errorMessage || err.message || "Failed to create record",
          variant: "destructive",
        });
      }
      return { data: null, error: err };
    }
  };

  /**
   * Read records with optional filtering
   */
  const read = async (
    filters?: Partial<T>,
    queryOptions?: QueryOptions
  ): Promise<{ data: T[] | null; error: Error | null }> => {
    try {
      let query = supabase.from(tableName as any).select("*") as any;

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (queryOptions?.orderBy) {
        query = query.order(queryOptions.orderBy.column, {
          ascending: queryOptions.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (queryOptions?.limit) {
        query = query.limit(queryOptions.limit);
      }
      if (queryOptions?.offset) {
        query = query.range(
          queryOptions.offset,
          queryOptions.offset + (queryOptions.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data as unknown as T[] |null, error: null };
    } catch (error) {
      const err = error as Error;
      return { data: null, error: err };
    }
  };

  /**
   * Read a single record by ID (uses maybeSingle for safety)
   */
  const readOne = async (
    id: string,
    options: DatabaseOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", id)
        .maybeSingle() as any;

      if (error) throw error;

      if (!data && opts.showErrorToast) {
        toast({
          title: "Not Found",
          description: "Record not found",
          variant: "destructive",
        });
      }

      return { data: data as unknown as T | null, error: null };
    } catch (error) {
      const err = error as Error;
      if (opts.showErrorToast) {
        toast({
          title: "Error",
          description: err.message || "Failed to fetch record",
          variant: "destructive",
        });
      }
      return { data: null, error: err };
    }
  };

  /**
   * Update a record by ID
   */
  const update = async (
    id: string,
    data: Partial<T>,
    options: DatabaseOptions = {}
  ): Promise<{ data: T | null; error: Error | null }> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Validate input if enabled
      if (opts.validateInput) {
        const validation = validateData(data);
        if (!validation.isValid) {
          const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
          if (opts.showErrorToast) {
            toast({
              title: "Validation Error",
              description: validation.errors.join(', '),
              variant: "destructive",
            });
          }
          return { data: null, error };
        }
        data = validation.sanitized;
      }

      const { data: result, error } = await supabase
        .from(tableName as any)
        .update(data as any)
        .eq("id", id)
        .select()
        .maybeSingle() as any;

      if (error) throw error;

      if (!result) {
        throw new Error("Record not found");
      }

      if (opts.showSuccessToast) {
        toast({
          title: "Success",
          description: opts.successMessage || "Record updated successfully",
        });
      }

      return { data: result as unknown as T, error: null };
    } catch (error) {
      const err = error as Error;
      if (opts.showErrorToast) {
        toast({
          title: "Error",
          description: opts.errorMessage || err.message || "Failed to update record",
          variant: "destructive",
        });
      }
      return { data: null, error: err };
    }
  };

  /**
   * Delete a record by ID
   */
  const remove = async (
    id: string,
    options: DatabaseOptions = {}
  ): Promise<{ success: boolean; error: Error | null }> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      const { error } = await supabase.from(tableName as any).delete().eq("id", id);

      if (error) throw error;

      if (opts.showSuccessToast) {
        toast({
          title: "Success",
          description: opts.successMessage || "Record deleted successfully",
        });
      }

      return { success: true, error: null };
    } catch (error) {
      const err = error as Error;
      if (opts.showErrorToast) {
        toast({
          title: "Error",
          description: opts.errorMessage || err.message || "Failed to delete record",
          variant: "destructive",
        });
      }
      return { success: false, error: err };
    }
  };

  /**
   * Bulk create records
   */
  const createMany = async (
    items: Partial<T>[],
    options: DatabaseOptions = {}
  ): Promise<{ data: T[] | null; error: Error | null }> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Validate all items if enabled
      if (opts.validateInput) {
        const validatedItems: Partial<T>[] = [];
        const allErrors: string[] = [];

        for (let i = 0; i < items.length; i++) {
          const validation = validateData(items[i]);
          if (!validation.isValid) {
            allErrors.push(`Item ${i + 1}: ${validation.errors.join(', ')}`);
          } else {
            validatedItems.push(validation.sanitized);
          }
        }

        if (allErrors.length > 0) {
          const error = new Error(`Validation failed: ${allErrors.join('; ')}`);
          if (opts.showErrorToast) {
            toast({
              title: "Validation Error",
              description: allErrors.slice(0, 3).join('; ') + (allErrors.length > 3 ? '...' : ''),
              variant: "destructive",
            });
          }
          return { data: null, error };
        }

        items = validatedItems;
      }

      const { data: result, error } = await supabase
        .from(tableName as any)
        .insert(items as any)
        .select() as any;

      if (error) throw error;

      if (opts.showSuccessToast) {
        toast({
          title: "Success",
          description: opts.successMessage || `${items.length} records created successfully`,
        });
      }

      return { data: result as unknown as T[], error: null };
    } catch (error) {
      const err = error as Error;
      if (opts.showErrorToast) {
        toast({
          title: "Error",
          description: opts.errorMessage || err.message || "Failed to create records",
          variant: "destructive",
        });
      }
      return { data: null, error: err };
    }
  };

  return {
    create,
    read,
    readOne,
    update,
    remove,
    createMany,
  };
}
