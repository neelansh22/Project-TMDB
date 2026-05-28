/**
 * useDrilldownData Hook
 * 
 * Generic data fetching hook for drilldown levels.
 * Handles API calls, loading states, error handling, and caching.
 */

import { useState, useEffect, useCallback } from 'react';
import { DrilldownApiResponse } from '@/types/drilldown';

interface UseDrilldownDataOptions<T> {
  /** API endpoint to fetch from */
  endpoint: string;
  
  /** Whether to fetch immediately */
  enabled?: boolean;
  
  /** Filters/params to send with request */
  filters?: Record<string, any>;
  
  /** Transform response data */
  transform?: (data: any) => T;
  
  /** Callback on success */
  onSuccess?: (data: T) => void;
  
  /** Callback on error */
  onError?: (error: Error) => void;
  
  /** Cache key (for client-side caching) */
  cacheKey?: string;
  
  /** Cache duration in milliseconds */
  cacheDuration?: number;
}

interface UseDrilldownDataReturn<T> {
  /** Fetched data */
  data: T | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Whether data was loaded from cache */
  isCached: boolean;
  
  /** Refetch function */
  refetch: () => Promise<void>;
  
  /** Clear cached data */
  clearCache: () => void;
}

// Simple in-memory cache
const dataCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Hook for fetching drilldown data
 */
export function useDrilldownData<T = any>(
  options: UseDrilldownDataOptions<T>
): UseDrilldownDataReturn<T> {
  const {
    endpoint,
    enabled = true,
    filters = {},
    transform,
    onSuccess,
    onError,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    if (cacheKey) {
      const cached = dataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        const transformedData = transform ? transform(cached.data) : cached.data;
        setData(transformedData);
        setIsCached(true);
        setError(null);
        onSuccess?.(transformedData);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setIsCached(false);

    try {
      // Build URL with query params
      const url = new URL(endpoint, window.location.origin);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: DrilldownApiResponse<any> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      const transformedData = transform ? transform(result.data) : result.data;
      
      // Cache the response
      if (cacheKey) {
        dataCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
      }

      setData(transformedData);
      setError(null);
      onSuccess?.(transformedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setData(null);
      onError?.(error);
      console.error('Drilldown data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, enabled, filters, transform, onSuccess, onError, cacheKey, cacheDuration]);

  /**
   * Clear cached data
   */
  const clearCache = useCallback(() => {
    if (cacheKey) {
      dataCache.delete(cacheKey);
    }
  }, [cacheKey]);

  /**
   * Refetch data (bypasses cache)
   */
  const refetch = useCallback(async () => {
    clearCache();
    await fetchData();
  }, [clearCache, fetchData]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isCached,
    refetch,
    clearCache,
  };
}

/**
 * Hook for posting data to API (for actions, filters, etc.)
 */
export function useDrilldownMutation<TData = any, TVariables = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (endpoint: string, variables: TVariables): Promise<TData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variables),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: DrilldownApiResponse<TData> = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Mutation failed');
        }

        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Drilldown mutation error:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Clear all cached drilldown data
 */
export function clearAllDrilldownCache() {
  dataCache.clear();
}
