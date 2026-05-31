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
  onBack,
  isLoading,
}: DrilldownLevelProps<Level3Data>) {
  // Extract callId from context (filters) - this is passed from Level 2
  const callId = context?.callId || data?.callId;

  console.log('Level3ConversationWrapper - context:', context, 'data:', data, 'callId:', callId);

  if (!callId) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          Call ID not found. Please try drilling down from a call.
        </div>
        <pre className="mt-4 text-xs bg-gray-800 p-4 rounded text-gray-300">
          Context: {JSON.stringify(context, null, 2)}
        </pre>
      </div>
    );
  }

  // ConversationViewer fetches its own data, so we just pass the callId
  // No need to wait for data from DrilldownModal
  return (
    <div className="h-full">
      <ConversationViewer
        callId={callId}
        onClose={() => {
          // Navigate back to Level 2 when close button is clicked
          if (onBack) {
            onBack();
          }
        }}
      />
    </div>
  );
}
