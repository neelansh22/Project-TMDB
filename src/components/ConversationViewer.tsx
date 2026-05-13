'use client';

import { useEffect, useState } from 'react';
import { X, User, Bot, TrendingUp, TrendingDown, Minus, Clock, Phone } from 'lucide-react';

interface Turn {
  turnId: string;
  turnNumber: number;
  turnTimestamp: string;
  speaker: string;
  utteranceText: string;
  utteranceType: string;
  sentiment: string;
  confidence: number;
}

interface SentimentCheckpoint {
  checkpointId: string;
  checkpointTimestamp: string;
  checkpointNumber: number;
  sentimentScore: number;
  sentimentLabel: string;
  emotionDetected: string;
  confidenceScore: number;
}

interface Intent {
  intentName: string;
  intentCategory: string;
  intentDescription: string;
  intentConfidence: number;
  detectedAt: string;
}

interface CallDetails {
  callId: string;
  sessionId: string;
  callDate: string;
  channel: string;
  duration: number;
  callDirection: string;
  customerSentiment: string;
  agentName: string;
  callOutcome: string;
  resolutionStatus: string;
  transferCount: number;
  city: string;
  state: string;
  country: string;
}

interface ConversationViewerProps {
  callId: string;
  onClose: () => void;
}

export default function ConversationViewer({ callId, onClose }: ConversationViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sentimentCheckpoints, setSentimentCheckpoints] = useState<SentimentCheckpoint[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);

  useEffect(() => {
    fetchConversationDetails();
  }, [callId]);

  const fetchConversationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/details?callId=${callId}`);
      const result = await response.json();

      if (result.success) {
        setCallDetails(result.callDetails);
        setTurns(result.turns);
        setSentimentCheckpoints(result.sentimentCheckpoints);
        setIntents(result.intents);
      } else {
        setError(result.error || 'Failed to load conversation');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    const sentimentLower = sentiment?.toLowerCase() || '';
    if (sentimentLower.includes('positive') || sentimentLower.includes('happy')) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (sentimentLower.includes('negative') || sentimentLower.includes('angry') || sentimentLower.includes('frustrated')) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    const sentimentLower = sentiment?.toLowerCase() || '';
    if (sentimentLower.includes('positive') || sentimentLower.includes('happy')) {
      return 'text-green-400 bg-green-900/20 border-green-800';
    } else if (sentimentLower.includes('negative') || sentimentLower.includes('angry') || sentimentLower.includes('frustrated')) {
      return 'text-red-400 bg-red-900/20 border-red-800';
    } else {
      return 'text-gray-400 bg-gray-900/20 border-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !callDetails) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md">
          <h3 className="text-xl font-bold text-red-400 mb-4">Error</h3>
          <p className="text-gray-300 mb-4">{error || 'Failed to load conversation'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Conversation Details</h2>
            <p className="text-sm text-gray-400">Session: {callDetails.sessionId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Call Info Bar */}
        <div className="p-4 bg-gray-800/50 border-b border-gray-800 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Duration:</span>
            <span className="text-white font-medium">{formatDuration(callDetails.duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Channel:</span>
            <span className="text-white font-medium">{callDetails.channel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Agent:</span>
            <span className="text-white font-medium">{callDetails.agentName || 'N/A'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Conversation Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {turns.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No conversation turns available</div>
            ) : (
              turns.map((turn) => {
                const isCustomer = turn.speaker?.toLowerCase() === 'customer' || turn.speaker?.toLowerCase() === 'user';
                
                return (
                  <div
                    key={turn.turnId}
                    className={`flex gap-3 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCustomer && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] ${isCustomer ? 'order-first' : ''}`}>
                      <div className={`rounded-lg p-4 ${
                        isCustomer 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-800 text-gray-100'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold opacity-80">
                            {isCustomer ? 'Customer' : 'Agent/Bot'}
                          </span>
                          {turn.sentiment && getSentimentIcon(turn.sentiment)}
                        </div>
                        <p className="text-sm leading-relaxed">{turn.utteranceText}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <Clock className="w-3 h-3" />
                          {new Date(turn.turnTimestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {isCustomer && (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Sidebar - Insights */}
          <div className="w-80 border-l border-gray-800 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
            {/* Sentiment Timeline */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3">Sentiment Timeline</h3>
              {sentimentCheckpoints.length === 0 ? (
                <p className="text-xs text-gray-500">No sentiment data available</p>
              ) : (
                <div className="space-y-2">
                  {sentimentCheckpoints.map((checkpoint) => (
                    <div
                      key={checkpoint.checkpointId}
                      className={`p-2 rounded border text-xs ${getSentimentColor(checkpoint.sentimentLabel)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{checkpoint.sentimentLabel}</span>
                        <span className="text-xs opacity-75">
                          {checkpoint.sentimentScore != null && typeof checkpoint.sentimentScore === 'number' && !isNaN(checkpoint.sentimentScore) 
                            ? checkpoint.sentimentScore.toFixed(1) 
                            : 'N/A'}/5
                        </span>
                      </div>
                      {checkpoint.emotionDetected && (
                        <div className="text-xs opacity-75">{checkpoint.emotionDetected}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detected Intents */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3">Detected Topics</h3>
              {intents.length === 0 ? (
                <p className="text-xs text-gray-500">No intents detected</p>
              ) : (
                <div className="space-y-2">
                  {intents.map((intent, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-purple-900/20 border border-purple-800 text-xs"
                    >
                      <div className="font-semibold text-purple-300 mb-1">{intent.intentName}</div>
                      <div className="text-gray-400 text-xs mb-1">{intent.intentDescription}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400">{intent.intentCategory}</span>
                        <span className="text-gray-500">
                          {intent.intentConfidence != null && typeof intent.intentConfidence === 'number' && !isNaN(intent.intentConfidence)
                            ? (intent.intentConfidence * 100).toFixed(0) 
                            : 'N/A'}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call Outcome */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3">Call Summary</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400">Outcome:</span>
                  <span className="text-white ml-2 font-medium">{callDetails.callOutcome || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Resolution:</span>
                  <span className="text-white ml-2 font-medium">{callDetails.resolutionStatus || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Transfers:</span>
                  <span className="text-white ml-2 font-medium">{callDetails.transferCount || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">Overall Sentiment:</span>
                  <span className={`ml-2 font-medium ${
                    callDetails.customerSentiment?.toLowerCase().includes('positive') 
                      ? 'text-green-400' 
                      : callDetails.customerSentiment?.toLowerCase().includes('negative')
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {callDetails.customerSentiment || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
