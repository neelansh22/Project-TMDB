'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import GeographicHeatmap from '@/components/GeographicHeatmap';
import Sidebar from '@/components/Sidebar';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  callVolume: number;
  avgSentimentScore: number;
  happyPercent: number;
  satisfiedPercent: number;
  negativePercent: number;
  happyCount: number;
  satisfiedCount: number;
  frustratedCount: number;
  angryCount: number;
}

export default function GeographyPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLocations: 0,
    totalCalls: 0,
    avgSentiment: 0,
    topCity: ''
  });

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    fetchGeographyData();
  }, []);

  const fetchGeographyData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/geography');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        
        // Calculate stats
        const totalCalls = result.data.reduce((sum: number, loc: LocationData) => sum + loc.callVolume, 0);
        const avgSentiment = result.data.reduce((sum: number, loc: LocationData) => sum + loc.avgSentimentScore, 0) / result.data.length;
        const topCity = result.data.sort((a: LocationData, b: LocationData) => b.callVolume - a.callVolume)[0];

        setStats({
          totalLocations: result.totalLocations,
          totalCalls,
          avgSentiment,
          topCity: topCity ? `${topCity.city}, ${topCity.state}` : 'N/A'
        });
      } else {
        setError(result.error || 'Failed to fetch geography data');
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading geographic data...</p>
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
              <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Geography</h2>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={fetchGeographyData}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
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
            <h1 className="text-3xl font-bold mb-2">Geographic Insights</h1>
            <p className="text-gray-400">
              Call volume and sentiment distribution across locations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Locations</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.totalLocations}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Calls</div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalCalls.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Avg Sentiment</div>
            <div className="text-2xl font-bold text-purple-400">{stats.avgSentiment.toFixed(2)}/5</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Top Location</div>
            <div className="text-lg font-bold text-amber-400 truncate">{stats.topCity}</div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Sentiment Heatmap</h2>
          <div className="h-[600px] relative">
            <GeographicHeatmap data={data} />
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            💡 Click on markers for detailed metrics. Hover to see city names.
          </p>
        </div>

        {/* Top Locations Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Top Locations by Call Volume</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-left">
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Rank</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400">City</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400">State</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Calls</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Sentiment</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Happy %</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Negative %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.slice(0, 15).map((location, index) => (
                  <tr key={index} className="hover:bg-gray-850 transition-colors">
                    <td className="py-3 pr-4 text-gray-500">#{index + 1}</td>
                    <td className="py-3 pr-4 font-medium text-white">{location.city}</td>
                    <td className="py-3 pr-4 text-gray-400">{location.state}</td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {location.callVolume.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={`font-bold ${
                        location.avgSentimentScore >= 4 ? 'text-green-400' :
                        location.avgSentimentScore >= 3 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {location.avgSentimentScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-green-400">
                      {location.happyPercent?.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-4 text-right text-red-400">
                      {location.negativePercent?.toFixed(1)}%
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
