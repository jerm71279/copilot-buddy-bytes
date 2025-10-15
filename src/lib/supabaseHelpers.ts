import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Enhanced Supabase Helper Functions
 * Provides type-safe wrappers with built-in error handling
 */

export interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
  count?: number;
}

export interface MutationResult {
  success: boolean;
  error: PostgrestError | Error | null;
}

/**
 * Safe query with automatic error handling
 * Uses maybeSingle() to prevent errors when no data is found
 */
export async function safeQueryOne<T>(
  tableName: string,
  filters: Record<string, any>
): Promise<QueryResult<T>> {
  try {
    let query = supabase.from(tableName as any).select("*") as any;

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as T | null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Safe query for multiple records
 */
export async function safeQueryMany<T>(
  tableName: string,
  filters?: Record<string, any>,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    select?: string;
  }
): Promise<QueryResult<T[]>> {
  try {
    let query = supabase.from(tableName as any).select(options?.select || "*", {
      count: "exact",
    }) as any;

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error, count: 0 };
    }

    return { data: data as unknown as T[], error: null, count: count || 0 };
  } catch (error) {
    return { data: null, error: error as Error, count: 0 };
  }
}

/**
 * Safe insert operation
 */
export async function safeInsert<T>(
  tableName: string,
  data: Partial<T> | Partial<T>[]
): Promise<QueryResult<T | T[]>> {
  try {
    const { data: result, error } = await supabase
      .from(tableName as any)
      .insert(data as any)
      .select() as any;

    if (error) {
      return { data: null, error };
    }

    // Return single object if single insert, array if bulk
    const returnData = Array.isArray(data)
      ? (result as unknown as T[])
      : (result?.[0] as unknown as T | null);

    return { data: returnData, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Safe update operation
 */
export async function safeUpdate<T>(
  tableName: string,
  id: string,
  data: Partial<T>
): Promise<QueryResult<T>> {
  try {
    const { data: result, error } = await supabase
      .from(tableName as any)
      .update(data as any)
      .eq("id", id)
      .select()
      .maybeSingle() as any;

    if (error) {
      return { data: null, error };
    }

    if (!result) {
      return { data: null, error: new Error("Record not found") };
    }

    return { data: result as unknown as T, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Safe delete operation
 */
export async function safeDelete(
  tableName: string,
  id: string
): Promise<MutationResult> {
  try {
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Get user's customer ID from profile
 */
export async function getUserCustomerId(userId: string): Promise<string | null> {
  const { data } = await safeQueryOne<{ customer_id: string }>(
    "user_profiles",
    { user_id: userId }
  );
  return data?.customer_id || null;
}

/**
 * Check if user has permission
 */
export async function checkUserPermission(
  userId: string,
  resource: string,
  permission: "view" | "edit" | "admin" = "view"
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("has_permission", {
      _user_id: userId,
      _resource_type: "portal",
      _resource_name: resource,
      _min_permission: permission,
    });

    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Format Supabase error for display
 */
export function formatSupabaseError(error: PostgrestError | Error): string {
  if ("code" in error) {
    // PostgrestError
    switch (error.code) {
      case "23505":
        return "This record already exists";
      case "23503":
        return "Cannot delete - record is referenced by other data";
      case "42501":
        return "Permission denied";
      case "PGRST301":
        return "Record not found";
      default:
        return error.message || "Database operation failed";
    }
  }
  return error.message || "An unexpected error occurred";
}

/**
 * Retry a database operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        // Wait with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}
