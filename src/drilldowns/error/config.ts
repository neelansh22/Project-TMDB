/**
 * Error Rate Drilldown Configuration
 * 
 * Defines the Error Rate drilldown behavior using the generic framework.
 * Analyzes errors by type, extracted from CallTurns where is_error = True
 */

import { DrilldownConfig, DataFieldConfig } from '@/types/drilldown';
import { AlertTriangle } from 'lucide-react';

/**
 * Data fields displayed in Level 2 (Calls with Errors)
 */
export const errorCallFields: DataFieldConfig[] = [
  {
    key: 'channel',
    label: 'Channel',
    type: 'text',
  },
  {
    key: 'duration',
    label: 'Duration',
    type: 'duration',
    sortable: true,
  },
  {
    key: 'totalTurns',
    label: 'Turns',
    type: 'number',
  },
  {
    key: 'errorCount',
    label: 'Error Count',
    type: 'number',
  },
  {
    key: 'sentimentJourney',
    label: 'Sentiment Journey',
    type: 'text',
    format: (value, row) => {
      const before = row?.initialSentiment || 'Unknown';
      const after = row?.finalSentiment || 'Unknown';
      return `${before} → ${after}`;
    },
  },
  {
    key: 'resolutionStatus',
    label: 'Outcome',
    type: 'status',
  },
];

/**
 * Error Rate Drilldown Configuration
 */
export const errorDrilldownConfig: DrilldownConfig = {
  id: 'error-rate',
  name: 'Error Analysis',
  icon: AlertTriangle,
  
  levels: {
    count: 3, // Rate → Error Types → Calls → Conversation
    
    configs: [
      // Level 1: Error Types Overview
      {
        title: (data) => {
          if (!data) return 'Error Analysis';
          return `Error Analysis - ${data.errorRate}% Error Rate`;
        },
        subtitle: (data) => {
          if (!data) return '';
          return `${data.totalErrors} errors across ${data.callsWithErrors} calls`;
        },
        dataFields: [
          { key: 'errorType', label: 'Error Type', type: 'text' },
          { key: 'errorCount', label: 'Count', type: 'number' },
          { key: 'percentage', label: 'Of Errors', type: 'percentage' },
          { key: 'callsAffected', label: 'Calls Affected', type: 'number' },
          { key: 'avgSentiment', label: 'Avg Sentiment', type: 'sentiment' },
        ],
        sortBy: 'errorCount',
        sortDirection: 'desc',
        actions: [
          {
            type: 'drill',
            label: 'View Calls',
            primary: true,
          },
        ],
      },
      
      // Level 2: Calls with Specific Error Type
      {
        title: (data) => {
          if (!data || !data.errorType) return 'Error Calls';
          return `${data.errorType} Errors`;
        },
        subtitle: (data) => {
          if (!data || !data.calls) return '';
          return `${data.calls.length} call${data.calls.length !== 1 ? 's' : ''} with ${data.errorType} errors`;
        },
        dataFields: errorCallFields,
        sortBy: 'errorCount',
        sortDirection: 'desc',
        actions: [
          {
            type: 'drill',
            label: 'View Conversation',
            primary: true,
          },
        ],
      },
      
      // Level 3: Conversation Details
      {
        title: (data) => {
          if (!data || !data.callId) return 'Call Details';
          return `Call ${data.callId} - Error Conversation`;
        },
        subtitle: 'View conversation with error moments highlighted',
        dataFields: [], // ConversationViewer handles display
        isTerminal: true,
      },
    ],
  },
  
  api: {
    level1: '/api/drilldowns/error/overview',
    level2: (filters) => {
      const params = new URLSearchParams({
        errorType: filters.errorType,
      });
      if (filters.isToolError !== undefined) {
        params.append('isToolError', String(filters.isToolError));
      }
      return `/api/drilldowns/error/breakdown?${params.toString()}`;
    },
    level3: (filters) => `/api/conversations/details?callId=${encodeURIComponent(filters.callId)}`,
  },
  
  visualization: {
    level1: 'bubble',
    level2: 'list',
    level3: 'conversation',
  },
  
  metadata: {
    description: 'Analyze error patterns, types, and recovery',
    category: 'Quality',
    tags: ['errors', 'quality', 'issues'],
  },
};
