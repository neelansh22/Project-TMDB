/**
 * Drilldown Registry
 * 
 * Central registry of all drilldown configurations.
 * Metrics can lookup their drilldown config by ID.
 */

import { DrilldownConfig, DrilldownRegistry } from '@/types/drilldown';
import { transferDrilldownConfigWithComponents } from './transfer';
import { errorDrilldownConfigWithComponents } from './error';

/**
 * Registry of all drilldowns
 * Add new drilldowns here as they are implemented
 */
const drilldownRegistry: DrilldownRegistry = {
  // Transfer drilldown
  'transfer-rate': {
    config: transferDrilldownConfigWithComponents,
    enabled: true,
  },
  
  // Error drilldown
  'error-rate': {
    config: errorDrilldownConfigWithComponents,
    enabled: true,
  },
  
  // Future drilldowns:
  // 'resolution-rate': { config: resolutionDrilldownConfig, enabled: false },
  // 'drop-rate': { config: dropRateDrilldownConfig, enabled: false },
};

/**
 * Get drilldown configuration by metric ID
 */
export function getDrilldownConfig(metricId: string): DrilldownConfig | null {
  const entry = drilldownRegistry[metricId];
  
  if (!entry) {
    console.warn(`No drilldown registered for metric: ${metricId}`);
    return null;
  }
  
  if (!entry.enabled) {
    console.warn(`Drilldown disabled for metric: ${metricId}`);
    return null;
  }
  
  return entry.config;
}

/**
 * Check if a metric has drilldown enabled
 */
export function hasDrilldown(metricId: string): boolean {
  const entry = drilldownRegistry[metricId];
  return entry !== undefined && entry.enabled === true;
}

/**
 * Get all enabled drilldowns
 */
export function getEnabledDrilldowns(): DrilldownConfig[] {
  return Object.values(drilldownRegistry)
    .filter((entry) => entry.enabled)
    .map((entry) => entry.config);
}

/**
 * Register a new drilldown (for dynamic registration)
 */
export function registerDrilldown(
  metricId: string,
  config: DrilldownConfig,
  options: { enabled?: boolean; requiresAuth?: boolean; requiresFeatureFlag?: string } = {}
) {
  drilldownRegistry[metricId] = {
    config,
    enabled: options.enabled ?? true,
    requiresAuth: options.requiresAuth,
    requiresFeatureFlag: options.requiresFeatureFlag,
  };
}

// Export the registry for direct access if needed
export { drilldownRegistry };
