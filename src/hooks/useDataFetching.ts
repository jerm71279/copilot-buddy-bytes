import { useState, useEffect, useCallback } from "react";
import { useDatabase, QueryOptions } from "./useDatabase";
import { useNotification } from "./useNotification";

/**
 * Centralized Data Fetching Hook
 * Eliminates repeated loading/error state management
 */

export interface DataFetchingState<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export interface FetchOptions<T> {
  filters?: Partial<T>;
  queryOptions?: QueryOptions;
  autoLoad?: boolean;
  showErrorToast?: boolean;
  pageSize?: number;
}

export function useDataFetching<T extends Record<string, any>>(
  tableName: string,
  options: FetchOptions<T> = {}
): DataFetchingState<T> {
  const {
    filters,
    queryOptions,
    autoLoad = true,
    showErrorToast = true,
    pageSize = 50,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const db = useDatabase<T>(tableName);
  const notify = useNotification();

  const fetchData = useCallback(
    async (reset: boolean = false) => {
      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;
      const offset = currentPage * pageSize;

      const { data: result, error: fetchError } = await db.read(filters, {
        ...queryOptions,
        limit: pageSize,
        offset,
      });

      if (fetchError) {
        setError(fetchError);
        if (showErrorToast) {
          notify.operations.loadError(tableName);
        }
        setIsLoading(false);
        return;
      }

      if (result) {
        if (reset) {
          setData(result);
        } else {
          setData((prev) => [...prev, ...result]);
        }
        setHasMore(result.length === pageSize);
        if (!reset) {
          setPage((p) => p + 1);
        }
      }

      setIsLoading(false);
    },
    [tableName, filters, queryOptions, page, pageSize, showErrorToast]
  );

  const refresh = useCallback(async () => {
    setPage(0);
    await fetchData(true);
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchData(false);
    }
  }, [fetchData, isLoading, hasMore]);

  useEffect(() => {
    if (autoLoad) {
      fetchData(true);
    }
  }, [autoLoad, filters, queryOptions]);

  return {
    data,
    isLoading,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}

/**
 * Hook for fetching a single item
 */
export function useDataItem<T extends Record<string, any>>(
  tableName: string,
  id: string | null,
  options: { autoLoad?: boolean; showErrorToast?: boolean } = {}
) {
  const { autoLoad = true, showErrorToast = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const db = useDatabase<T>(tableName);
  const notify = useNotification();

  const fetchItem = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: result, error: fetchError } = await db.readOne(id, {
      showErrorToast,
    });

    if (fetchError) {
      setError(fetchError);
      if (showErrorToast) {
        notify.operations.loadError(tableName);
      }
    } else {
      setData(result);
    }

    setIsLoading(false);
  }, [id, tableName, showErrorToast]);

  const refresh = useCallback(async () => {
    await fetchItem();
  }, [fetchItem]);

  useEffect(() => {
    if (autoLoad && id) {
      fetchItem();
    }
  }, [autoLoad, id]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
