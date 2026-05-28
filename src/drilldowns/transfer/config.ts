/**
 * Transfer Drilldown Configuration
 * 
 * Defines the Transfer Rate drilldown behavior using the generic framework.
 * This configuration-driven approach makes the drilldown maintainable and scalable.
 */

import { DrilldownConfig, DataFieldConfig } from '@/types/drilldown';
import { ArrowRightLeft } from 'lucide-react';

/**
 * Data fields displayed in Level 2 (Calls by Reason)
 */
export const transferCallFields: DataFieldConfig[] = [
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
 * Transfer Rate Drilldown Configuration
 */
export const transferDrilldownConfig: DrilldownConfig = {
  id: 'transfer-rate',
  name: 'Transfer Analysis',
  icon: ArrowRightLeft,
  
  levels: {
    count: 3, // Rate → Reasons → Calls → Conversation
    
    configs: [
      // Level 1: Transfer Reasons Overview
      {
        title: (data) => {
          if (!data) return 'Transfer Analysis';
          return `Transfer Analysis - ${data.transferRate}% Transfer Rate`;
        },
        subtitle: (data) => {
          if (!data) return '';
          return `${data.totalTransfers} transfers out of ${data.totalCalls} calls`;
        },
        dataFields: [
          { key: 'reasonName', label: 'Transfer Reason', type: 'text' },
          { key: 'transferCount', label: 'Count', type: 'number' },
          { key: 'percentage', label: 'Of Transfers', type: 'percentage' },
          { key: 'resolutionRate', label: 'Resolution Rate', type: 'percentage' },
          { key: 'avgSentiment', label: 'Avg Sentiment', type: 'sentiment' },
        ],
        sortBy: 'transferCount',
        sortDirection: 'desc',
        actions: [
          {
            type: 'drill',
            label: 'View Calls',
            primary: true,
          },
        ],
      },
      
      // Level 2: Calls by Reason
      {
        title: (data) => {
          if (!data || !data.reasonName) return 'Transfer Calls';
          return `${data.reasonName} Transfers`;
        },
        subtitle: (data) => {
          if (!data || !data.calls) return '';
          return `${data.calls.length} call${data.calls.length !== 1 ? 's' : ''} transferred due to ${data.reasonName}`;
        },
        dataFields: transferCallFields,
        sortBy: 'timeBeforeTransfer',
        sortDirection: 'asc',
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
          return `Call ${data.callId} - Full Conversation`;
        },
        subtitle: 'View conversation with transfer moment highlighted',
        dataFields: [], // ConversationViewer handles display
        isTerminal: true,
      },
    ],
  },
  
  api: {
    level1: '/api/drilldowns/transfer/overview',
    level2: (filters) => `/api/drilldowns/transfer/breakdown?reasonId=${encodeURIComponent(filters.reasonId)}`,
    level3: (filters) => `/api/conversations/details?callId=${encodeURIComponent(filters.callId)}`,
  },
  
  visualization: {
    level1: 'bubble',
    level2: 'list',
    level3: 'conversation',
  },
  
  metadata: {
    description: 'Analyze transfer patterns, reasons, and outcomes',
    category: 'Operations',
    tags: ['transfers', 'escalations', 'operations'],
  },
};
