/**
 * useDrilldownNavigation Hook
 * 
 * Manages navigation state for drilldown modals.
 * Handles level transitions, back navigation, history stack, and filter state.
 */

import { useState, useCallback } from 'react';
import {
  DrilldownNavigationState,
  DrilldownNavigationActions,
  NavigationHistoryItem,
} from '@/types/drilldown';

interface UseDrilldownNavigationOptions {
  /** Maximum number of levels */
  maxLevels: number;
  
  /** Initial level (default: 1) */
  initialLevel?: number;
  
  /** Initial filters */
  initialFilters?: Record<string, any>;
  
  /** Callback when level changes */
  onLevelChange?: (level: number, filters: Record<string, any>) => void;
}

interface UseDrilldownNavigationReturn {
  state: DrilldownNavigationState;
  actions: DrilldownNavigationActions;
}

/**
 * Hook for managing drilldown navigation state
 */
export function useDrilldownNavigation(
  options: UseDrilldownNavigationOptions
): UseDrilldownNavigationReturn {
  const {
    maxLevels,
    initialLevel = 1,
    initialFilters = {},
    onLevelChange,
  } = options;

  // Navigation state
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [history, setHistory] = useState<NavigationHistoryItem[]>([
    {
      level: initialLevel,
      filters: initialFilters,
      timestamp: Date.now(),
    },
  ]);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [currentData, setCurrentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Navigate forward to the next level
   */
  const drillForward = useCallback(
    (newFilters: Record<string, any>) => {
      if (currentLevel >= maxLevels) {
        console.warn(`Cannot drill forward from level ${currentLevel} (max: ${maxLevels})`);
        return;
      }

      const nextLevel = currentLevel + 1;
      const mergedFilters = { ...filters, ...newFilters };

      // Add current state to history
      setHistory((prev) => [
        ...prev,
        {
          level: currentLevel,
          filters: filters,
          data: currentData,
          timestamp: Date.now(),
        },
      ]);

      // Update state
      setCurrentLevel(nextLevel);
      setFilters(mergedFilters);
      setCurrentData(null); // Clear data, will be fetched by consumer
      setError(null);

      // Notify consumer
      onLevelChange?.(nextLevel, mergedFilters);
    },
    [currentLevel, maxLevels, filters, currentData, onLevelChange]
  );

  /**
   * Navigate back to the previous level
   */
  const goBack = useCallback(() => {
    if (history.length <= 1) {
      console.warn('Cannot go back from level 1');
      return;
    }

    // Pop last item from history
    const newHistory = [...history];
    newHistory.pop();
    
    // Get previous state
    const previousState = newHistory[newHistory.length - 1];

    // Restore state
    setHistory(newHistory);
    setCurrentLevel(previousState.level);
    setFilters(previousState.filters);
    setCurrentData(previousState.data || null);
    setError(null);

    // Notify consumer
    onLevelChange?.(previousState.level, previousState.filters);
  }, [history, onLevelChange]);

  /**
   * Jump to a specific level (clears forward history)
   */
  const jumpToLevel = useCallback(
    (targetLevel: number) => {
      if (targetLevel < 1 || targetLevel > maxLevels) {
        console.warn(`Invalid level ${targetLevel} (min: 1, max: ${maxLevels})`);
        return;
      }

      if (targetLevel === currentLevel) {
        return;
      }

      // Find history item at target level
      const targetHistoryIndex = history.findIndex((item) => item.level === targetLevel);

      if (targetHistoryIndex === -1) {
        console.warn(`No history found for level ${targetLevel}`);
        return;
      }

      // Truncate history to target level
      const newHistory = history.slice(0, targetHistoryIndex + 1);
      const targetState = newHistory[newHistory.length - 1];

      // Restore state
      setHistory(newHistory);
      setCurrentLevel(targetState.level);
      setFilters(targetState.filters);
      setCurrentData(targetState.data || null);
      setError(null);

      // Notify consumer
      onLevelChange?.(targetState.level, targetState.filters);
    },
    [currentLevel, maxLevels, history, onLevelChange]
  );

  /**
   * Reset navigation to level 1
   */
  const reset = useCallback(() => {
    const resetFilters = initialFilters;
    
    setHistory([
      {
        level: 1,
        filters: resetFilters,
        timestamp: Date.now(),
      },
    ]);
    setCurrentLevel(1);
    setFilters(resetFilters);
    setCurrentData(null);
    setError(null);

    // Notify consumer
    onLevelChange?.(1, resetFilters);
  }, [initialFilters, onLevelChange]);

  /**
   * Update filters at current level (without changing level)
   */
  const updateFilters = useCallback(
    (newFilters: Record<string, any>) => {
      const mergedFilters = { ...filters, ...newFilters };
      setFilters(mergedFilters);

      // Update history item for current level
      setHistory((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            filters: mergedFilters,
          };
        }
        return updated;
      });

      // Notify consumer
      onLevelChange?.(currentLevel, mergedFilters);
    },
    [filters, currentLevel, onLevelChange]
  );

  // Exposed state
  const state: DrilldownNavigationState = {
    currentLevel,
    history,
    filters,
    currentData,
    isLoading,
    error,
  };

  // Exposed actions
  const actions: DrilldownNavigationActions = {
    drillForward,
    goBack,
    jumpToLevel,
    reset,
    updateFilters,
  };

  return { state, actions };
}

/**
 * Helper to set loading state
 */
export function useDrilldownLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((err: Error) => {
    setIsLoading(false);
    setError(err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError,
  };
}
