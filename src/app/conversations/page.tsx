'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopicsDonutChart from '@/components/TopicsDonutChart';
import ConversationViewer from '@/components/ConversationViewer';
import { ArrowLeft, Phone, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TopicData {
  intentName: string;
  intentCategory: string;
  intentDescription: string;
  callCount: number;
  totalOccurrences: number;
  avgConfidence: number;
  percentage: string;
}

interface CallData {
  callId: string;
  sessionId?: string;
  callDate: string;
  channel: string;
  duration: number;
  callDirection?: string;
  customerSentiment: string;
  agentName?: string;
  callOutcome?: string;
  resolutionStatus?: string;
  transferCount?: number;
  totalTurns?: number;
  intentName?: string;
  intentConfidence?: number;
  intentCategory?: string;
}

export default function ConversationsPage() {
  const { data: session, status } = useSession();
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [calls, setCalls] = useState<CallData[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/topics');
      const result = await response.json();

      if (result.success) {
        setTopics(result.data);
      } else {
        setError(result.error || 'Failed to fetch topics');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallsByTopic = async (intentName: string) => {
    try {
      setLoadingCalls(true);
      const response = await fetch(`/api/conversations/by-topic?intentName=${encodeURIComponent(intentName)}`);
      const result = await response.json();

      if (result.success) {
        setCalls(result.data);
        setSelectedTopic(intentName);
      } else {
        setError(result.error || 'Failed to fetch calls');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingCalls(false);
    }
  };

  const handleTopicClick = (intentName: string) => {
    fetchCallsByTopic(intentName);
  };

  const handleCallClick = (callId: string) => {
    setSelectedCallId(callId);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setCalls([]);
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
      return 'text-green-400';
    } else if (sentimentLower.includes('negative') || sentimentLower.includes('angry') || sentimentLower.includes('frustrated')) {
      return 'text-red-400';
    } else {
      return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userEmail={session?.user?.email} />
        <div className="flex-1 bg-gray-950 text-white p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !selectedTopic) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userEmail={session?.user?.email} />
        <div className="flex-1 bg-gray-950 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Conversations</h2>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={fetchTopics}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={session?.user?.email} />
      <div className="flex-1 bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Conversations</h1>
            <p className="text-gray-400">
              {selectedTopic 
                ? `Calls related to: ${selectedTopic}`
                : 'Select a topic to view related conversations'}
            </p>
          </div>

          {!selectedTopic ? (
            // Topic Selection View
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Topic Distribution Chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Topic Distribution</h2>
                <div className="h-[400px]">
                  <TopicsDonutChart data={topics} maxItems={8} />
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Click on a topic below to view related calls
                </p>
              </div>

              {/* Right: Topic List */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Select a Topic</h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.intentName}
                      onClick={() => handleTopicClick(topic.intentName)}
                      className="w-full text-left p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors border border-gray-700 hover:border-indigo-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{topic.intentName}</h3>
                          <p className="text-xs text-gray-400 mb-2">{topic.intentDescription}</p>
                          <span className="inline-block px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded text-xs">
                            {topic.intentCategory}
                          </span>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-indigo-400">{topic.callCount}</div>
                          <div className="text-xs text-gray-500">calls</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Calls Table View
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleBackToTopics}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Topics
              </button>

              {/* Calls Table */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Calls for: {selectedTopic}</h2>
                  <span className="text-gray-400 text-sm">{calls.length} total calls</span>
                </div>

                {loadingCalls ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading calls...</p>
                  </div>
                ) : calls.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No calls found for this topic</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-800">
                        <tr className="text-left">
                          <th className="pb-3 pr-4 font-semibold text-gray-400">Date</th>
                          <th className="pb-3 pr-4 font-semibold text-gray-400">Channel</th>
                          <th className="pb-3 pr-4 font-semibold text-gray-400">Duration</th>
                          <th className="pb-3 pr-4 font-semibold text-gray-400">Turns</th>
                          <th className="pb-3 pr-4 font-semibold text-gray-400">Sentiment</th>
                          <th className="pb-3 pr-4 font-semibold text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {calls.map((call) => (
                          <tr key={call.callId} className="hover:bg-gray-850 transition-colors">
                            <td className="py-3 pr-4 text-gray-300">
                              {new Date(call.callDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                                {call.channel}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-300">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                {formatDuration(call.duration)}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-gray-300">
                              {call.totalTurns || 'N/A'}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-1">
                                {getSentimentIcon(call.customerSentiment)}
                                <span className={getSentimentColor(call.customerSentiment)}>
                                  {call.customerSentiment || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <button
                                onClick={() => handleCallClick(call.callId)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium transition-colors"
                              >
                                View Chat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Viewer Modal */}
      {selectedCallId && (
        <ConversationViewer
          callId={selectedCallId}
          onClose={() => setSelectedCallId(null)}
        />
      )}
    </div>
  );
}
