/**
 * Generic Drilldown Framework - Type Definitions
 * 
 * This file contains all type definitions for the configuration-driven drilldown system.
 * Each metric drilldown (Transfer, Resolution, Drop Rate, etc.) uses these types to define
 * its behavior, data structure, and visualization approach.
 */

import { ReactNode } from 'react';

// ============================================================================
// CORE CONFIGURATION TYPES
// ============================================================================

/**
 * Main configuration for a metric drilldown
 * Defines levels, data sources, and visualization approach
 */
export interface DrilldownConfig<TLevel1 = any, TLevel2 = any, TLevel3 = any> {
  /** Unique identifier for this drilldown (e.g., 'transfer-rate') */
  id: string;
  
  /** Display name for the drilldown (e.g., 'Transfer Analysis') */
  name: string;
  
  /** Icon component to display (optional) */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Configuration for each level */
  levels: {
    /** Total number of levels (2, 3, or 4) */
    count: number;
    
    /** Configuration for each level */
    configs: LevelConfig[];
  };
  
  /** API endpoints for fetching data at each level */
  api: {
    /** Level 1: Overview/summary data */
    level1: string;
    
    /** Level 2: Breakdown data (function to build URL with filters) */
    level2: (filters: any) => string;
    
    /** Level 3: Detail data (optional, function to build URL with filters) */
    level3?: (filters: any) => string;
    
    /** Level 4: Deep detail (optional) */
    level4?: (filters: any) => string;
  };
  
  /** Visualization type for each level */
  visualization: {
    level1: VisualizationType;
    level2: VisualizationType;
    level3?: VisualizationType;
    level4?: VisualizationType;
  };
  
  /** Optional metadata */
  metadata?: {
    description?: string;
    category?: string;
    tags?: string[];
  };
}

/**
 * Configuration for a single level within a drilldown
 */
export interface LevelConfig {
  /** Title function - can use data to generate dynamic title */
  title: string | ((data?: any) => string);
  
  /** Optional subtitle */
  subtitle?: string | ((data?: any) => string);
  
  /** Data fields to display at this level */
  dataFields: DataFieldConfig[];
  
  /** How to group data (optional) */
  groupBy?: string;
  
  /** Default sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Actions available at this level (buttons, filters, etc.) */
  actions?: ActionConfig[];
  
  /** Optional custom component to render */
  customComponent?: React.ComponentType<any>;
  
  /** Whether this level is read-only (no drill forward) */
  isTerminal?: boolean;
}

/**
 * Configuration for a data field to display
 */
export interface DataFieldConfig {
  /** Field key in the data object */
  key: string;
  
  /** Display label */
  label: string;
  
  /** Data type for formatting */
  type: DataFieldType;
  
  /** Optional custom format function */
  format?: (value: any, row?: any) => string | ReactNode;
  
  /** Icon to display with field (optional) */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Whether field is sortable */
  sortable?: boolean;
  
  /** Whether field is filterable */
  filterable?: boolean;
  
  /** Width hint for tables/grids */
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Alignment for display */
  align?: 'left' | 'center' | 'right';
}

/**
 * Action configuration (buttons, drilldowns, filters)
 */
export interface ActionConfig {
  /** Action type */
  type: 'drill' | 'filter' | 'export' | 'custom';
  
  /** Button/action label */
  label: string;
  
  /** Icon (optional) */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Action handler (for custom actions) */
  handler?: (data: any) => void;
  
  /** Whether action is primary */
  primary?: boolean;
  
  /** Condition to show action */
  condition?: (data: any) => boolean;
}

// ============================================================================
// DATA TYPES
// ============================================================================

/**
 * Supported data field types for display and formatting
 */
export type DataFieldType =
  | 'text'
  | 'number'
  | 'percentage'
  | 'currency'
  | 'duration'
  | 'date'
  | 'datetime'
  | 'sentiment'
  | 'status'
  | 'badge'
  | 'tag'
  | 'link'
  | 'icon'
  | 'custom';

/**
 * Supported visualization types
 */
export type VisualizationType =
  | 'bubble'        // Bubble chart (impact clusters)
  | 'bar'           // Bar chart
  | 'horizontal-bar'// Horizontal bar chart
  | 'pie'           // Pie chart
  | 'donut'         // Donut chart
  | 'treemap'       // Tree map
  | 'timeline'      // Timeline view
  | 'heatmap'       // Heatmap
  | 'list'          // Simple list
  | 'grid'          // Grid layout
  | 'table'         // Data table
  | 'cards'         // Card grid
  | 'conversation'  // Conversation viewer (special)
  | 'custom';       // Custom component

// ============================================================================
// NAVIGATION & STATE TYPES
// ============================================================================

/**
 * Navigation state for drilldown
 */
export interface DrilldownNavigationState {
  /** Current level (1-based) */
  currentLevel: number;
  
  /** Navigation history stack */
  history: NavigationHistoryItem[];
  
  /** Current filters/context */
  filters: Record<string, any>;
  
  /** Data at current level */
  currentData: any;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
}

/**
 * Single item in navigation history
 */
export interface NavigationHistoryItem {
  /** Level number */
  level: number;
  
  /** Filters/context at this level */
  filters: Record<string, any>;
  
  /** Data snapshot (optional, for back navigation) */
  data?: any;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Navigation actions
 */
export interface DrilldownNavigationActions {
  /** Navigate forward to next level */
  drillForward: (filters: Record<string, any>) => void;
  
  /** Navigate back to previous level */
  goBack: () => void;
  
  /** Jump to specific level */
  jumpToLevel: (level: number) => void;
  
  /** Reset to level 1 */
  reset: () => void;
  
  /** Update filters at current level */
  updateFilters: (filters: Record<string, any>) => void;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response for drilldown data
 */
export interface DrilldownApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    totalCount?: number;
    filteredCount?: number;
    cached?: boolean;
    timestamp?: string;
  };
}

/**
 * Standard call data structure (used across drilldowns)
 */
export interface DrilldownCallData {
  callId: string;
  sessionId?: string;
  callDate: string;
  callStartTime: string;
  channel: string;
  duration: number;
  totalTurns: number;
  
  // Sentiment
  customerSentiment: string;
  initialSentiment?: string;
  finalSentiment?: string;
  
  // Outcome
  callOutcome: string;
  resolutionStatus: string;
  successfulResolution: boolean;
  
  // Intent
  intent?: string;
  intentCategory?: string;
  intentConfidence?: number;
  
  // Customer
  customerProfile?: string;
  customerTier?: string;
  
  // Transfer-specific
  wasTransferred?: boolean;
  transferReason?: string;
  timeBeforeTransfer?: number;
  
  // Error-specific
  hasErrors?: boolean;
  errorCount?: number;
  errorTypes?: string[];
  
  // Additional metadata
  metadata?: Record<string, any>;
}

// ============================================================================
// REGISTRY TYPES
// ============================================================================

/**
 * Drilldown registry entry
 */
export interface DrilldownRegistryEntry {
  config: DrilldownConfig;
  enabled: boolean;
  requiresAuth?: boolean;
  requiresFeatureFlag?: string;
}

/**
 * Drilldown registry type
 */
export type DrilldownRegistry = Record<string, DrilldownRegistryEntry>;

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for DrilldownModal component
 */
export interface DrilldownModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Drilldown configuration */
  config: DrilldownConfig;
  
  /** Initial data (optional, for pre-loaded state) */
  initialData?: any;
  
  /** Initial filters (optional) */
  initialFilters?: Record<string, any>;
}

/**
 * Props for level components
 */
export interface DrilldownLevelProps<TData = any> {
  /** Data for this level */
  data: TData;
  
  /** Level configuration */
  config: LevelConfig;
  
  /** Navigate forward handler */
  onDrill: (filters: Record<string, any>) => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error state */
  error?: Error | null;
  
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Props for CallListView component
 */
export interface CallListViewProps {
  /** List of calls to display */
  calls: DrilldownCallData[];
  
  /** Fields to display */
  fields: DataFieldConfig[];
  
  /** Click handler */
  onCallClick: (callId: string) => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Layout variant */
  variant?: 'list' | 'grid' | 'table';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Sentiment category
 */
export type SentimentCategory = 
  | 'Very Negative'
  | 'Negative'
  | 'Neutral'
  | 'Positive'
  | 'Very Positive'
  | 'Stressed'
  | 'Frustrated'
  | 'Satisfied'
  | 'Happy'
  | 'Angry';

/**
 * Status category
 */
export type StatusCategory =
  | 'Completed'
  | 'Pending'
  | 'Transferred'
  | 'Abandoned'
  | 'Failed'
  | 'In Progress';

/**
 * Resolution status
 */
export type ResolutionStatus = 'Resolved' | 'Unresolved' | 'Partial';
