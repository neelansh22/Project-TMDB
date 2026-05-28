/**
 * Transfer Drilldown - Level 3: Conversation Details Wrapper
 * 
 * Wrapper component that adapts ConversationViewer to work with drilldown framework
 */

'use client';

import { DrilldownLevelProps } from '@/types/drilldown';
import ConversationViewer from '@/components/ConversationViewer';

interface Level3Data {
  callId: string;
  callDetails: any;
  turns: any[];
  sentimentCheckpoints?: any[];
  intents?: any[];
}

export default function Level3ConversationWrapper({
  data,
  context,
  onDrill,
  isLoading,
}: DrilldownLevelProps<Level3Data>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          No conversation data available
        </div>
      </div>
    );
  }

  // Extract callId from context (passed from Level 2)
  const callId = context?.callId || data?.callId;

  if (!callId) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          Call ID not found. Please try again.
        </div>
        <pre className="mt-4 text-xs bg-gray-800 p-4 rounded text-gray-300">
          Context: {JSON.stringify(context, null, 2)}
        </pre>
      </div>
    );
  }

  // Use ConversationViewer but adapt it to not need onClose
  return (
    <div className="h-full">
      <ConversationViewer
        callId={callId}
        onClose={() => {
          // In drilldown context, we don't close - user uses back button
          console.log('Close requested from ConversationViewer (noop in drilldown)');
        }}
      />
    </div>
  );
}
