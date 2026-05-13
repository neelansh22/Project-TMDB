'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import TopicsDonutChart from '@/components/TopicsDonutChart';
import TopicRankingList from '@/components/TopicRankingList';
import Sidebar from '@/components/Sidebar';

interface TopicData {
  intentName: string;
  intentCategory: string;
  intentDescription: string;
  callCount: number;
  totalOccurrences: number;
  avgConfidence: number;
  percentage: string;
}

export default function TopicsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCalls, setTotalCalls] = useState(0);

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    fetchTopicsData();
  }, []);

  const fetchTopicsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/topics');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setTotalCalls(result.totalCalls);
      } else {
        setError(result.error || 'Failed to fetch topics data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userEmail={session?.user?.email} />
        <div className="flex-1 bg-gray-950 text-white p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading topics analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userEmail={session?.user?.email} />
        <div className="flex-1 bg-gray-950 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Topics</h2>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={fetchTopicsData}
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Topics Analysis</h1>
            <p className="text-gray-400">
              Understanding what customers are calling about
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-400">{totalCalls.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Calls Analyzed</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Donut Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Topic Distribution</h2>
            <div className="h-[400px]">
              <TopicsDonutChart data={data} maxItems={8} />
            </div>
          </div>

          {/* Right: Ranking List */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Top Topics Ranked</h2>
            <div className="overflow-y-auto max-h-[400px] pr-2">
              <TopicRankingList data={data} maxItems={10} />
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-left">
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Rank</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Topic</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Category</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Calls</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">%</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Occurrences</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.map((topic, index) => (
                  <tr key={index} className="hover:bg-gray-850 transition-colors">
                    <td className="py-3 pr-4 text-gray-500">#{index + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-white">{topic.intentName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {topic.intentDescription}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded text-xs">
                        {topic.intentCategory}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {topic.callCount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-indigo-400">
                      {topic.percentage}%
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-400">
                      {topic.totalOccurrences.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={`${
                        topic.avgConfidence >= 0.8 ? 'text-green-400' :
                        topic.avgConfidence >= 0.6 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {(topic.avgConfidence * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
