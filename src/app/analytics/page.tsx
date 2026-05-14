'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import TopicsDonutChart from '@/components/TopicsDonutChart';
import TopicRankingList from '@/components/TopicRankingList';
import TransferAnalysis from '@/components/TransferAnalysis';
import ErrorPatterns from '@/components/ErrorPatterns';

// Dynamic import for GeographicHeatmap to avoid SSR issues with Leaflet
const GeographicHeatmap = dynamic(
  () => import('@/components/GeographicHeatmap'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-800 animate-pulse rounded-lg" /> }
);

interface TopicData {
  intentName: string;
  intentCategory: string;
  intentDescription?: string;
  callCount: number;
  percentage: string;
  avgConfidence: number;
  totalOccurrences?: number;
  primaryIntentCount?: number;
  callPercentage?: number;
}

interface GeoData {
  city: string;
  call_count: number;
  avg_sentiment_score: number;
  positive_calls: number;
  neutral_calls: number;
  negative_calls: number;
  completion_rate: number;
  resolution_rate: number;
  transfer_rate: number;
}

interface TransferData {
  transfer_reason: string;
  transfer_count: number;
  percentage: number;
  avg_sentiment_score: number;
  resolution_after_transfer_rate: number;
}

interface ErrorData {
  error_type: string;
  error_count: number;
  percentage: number;
  avg_sentiment_score: number;
  avg_duration_seconds: number;
  calls_with_error: number;
}

// City coordinates mapping
const CITY_COORDINATES: { [key: string]: { lat: number; lon: number; state: string; country: string } } = {
  'New York': { lat: 40.7128, lon: -74.0060, state: 'NY', country: 'USA' },
  'Los Angeles': { lat: 34.0522, lon: -118.2437, state: 'CA', country: 'USA' },
  'Chicago': { lat: 41.8781, lon: -87.6298, state: 'IL', country: 'USA' },
  'Houston': { lat: 29.7604, lon: -95.3698, state: 'TX', country: 'USA' },
  'Phoenix': { lat: 33.4484, lon: -112.0740, state: 'AZ', country: 'USA' },
  'Philadelphia': { lat: 39.9526, lon: -75.1652, state: 'PA', country: 'USA' },
  'San Antonio': { lat: 29.4241, lon: -98.4936, state: 'TX', country: 'USA' },
  'San Diego': { lat: 32.7157, lon: -117.1611, state: 'CA', country: 'USA' },
  'Dallas': { lat: 32.7767, lon: -96.7970, state: 'TX', country: 'USA' },
  'San Jose': { lat: 37.3382, lon: -121.8863, state: 'CA', country: 'USA' },
  'Austin': { lat: 30.2672, lon: -97.7431, state: 'TX', country: 'USA' },
  'Jacksonville': { lat: 30.3322, lon: -81.6557, state: 'FL', country: 'USA' },
  'Fort Worth': { lat: 32.7555, lon: -97.3308, state: 'TX', country: 'USA' },
  'Columbus': { lat: 39.9612, lon: -82.9988, state: 'OH', country: 'USA' },
  'Charlotte': { lat: 35.2271, lon: -80.8431, state: 'NC', country: 'USA' },
  'San Francisco': { lat: 37.7749, lon: -122.4194, state: 'CA', country: 'USA' },
  'Indianapolis': { lat: 39.7684, lon: -86.1581, state: 'IN', country: 'USA' },
  'Seattle': { lat: 47.6062, lon: -122.3321, state: 'WA', country: 'USA' },
  'Denver': { lat: 39.7392, lon: -104.9903, state: 'CO', country: 'USA' },
  'Boston': { lat: 42.3601, lon: -71.0589, state: 'MA', country: 'USA' },
  'Miami': { lat: 25.7617, lon: -80.1918, state: 'FL', country: 'USA' },
  'Atlanta': { lat: 33.7490, lon: -84.3880, state: 'GA', country: 'USA' },
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [topicsData, setTopicsData] = useState<TopicData[]>([]);
  const [geoData, setGeoData] = useState<any[]>([]);
  const [transfersData, setTransfersData] = useState<TransferData[]>([]);
  const [errorsData, setErrorsData] = useState<ErrorData[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalyticsData();
    }
  }, [status]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [topicsRes, geoRes, transfersRes, errorsRes] = await Promise.all([
        fetch('/api/analytics/topics'),
        fetch('/api/analytics/geographic'),
        fetch('/api/analytics/transfers'),
        fetch('/api/analytics/errors'),
      ]);

      if (!topicsRes.ok || !geoRes.ok || !transfersRes.ok || !errorsRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [topics, geo, transfers, errors] = await Promise.all([
        topicsRes.json(),
        geoRes.json(),
        transfersRes.json(),
        errorsRes.json(),
      ]);

      setTopicsData(topics.data || []);
      setTransfersData(transfers.data || []);
      setErrorsData(errors.data || []);

      const transformedGeo = (geo.data || []).map((item: GeoData) => {
        const coords = CITY_COORDINATES[item.city] || { lat: 0, lon: 0, state: '', country: '' };
        return {
          latitude: coords.lat,
          longitude: coords.lon,
          city: item.city,
          state: coords.state,
          country: coords.country,
          callVolume: item.call_count,
          avgSentimentScore: item.avg_sentiment_score || 0,
          happyPercent: (item.positive_calls / item.call_count) * 100,
          satisfiedPercent: (item.neutral_calls / item.call_count) * 100,
          negativePercent: (item.negative_calls / item.call_count) * 100,
          happyCount: item.positive_calls,
          satisfiedCount: item.neutral_calls,
          frustratedCount: item.negative_calls,
          angryCount: 0,
        };
      }).filter((item: any) => item.latitude !== 0 && item.longitude !== 0);

      setGeoData(transformedGeo);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-semibold mb-2">Error Loading Analytics</h2>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar userEmail={session?.user?.email} />
      
      <div className="flex-1">
        <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Analytics Insights
              </h1>
              <p className="text-gray-400 text-sm mt-1">Deep dive into call patterns and performance</p>
            </div>
            <button
              onClick={fetchAnalyticsData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Topic Distribution</h2>
                <p className="text-gray-400 text-sm">What customers are calling about</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Visual Breakdown</h3>
                <div className="h-[400px]">
                  {topicsData.length > 0 ? (
                    <TopicsDonutChart data={topicsData} maxItems={8} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No topic data available
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Top Topics</h3>
                <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {topicsData.length > 0 ? (
                    <TopicRankingList data={topicsData} maxItems={10} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No topic data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 border-2 border-purple-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Geographic Distribution</h2>
                <p className="text-gray-400 text-sm">Call volume and sentiment by location</p>
              </div>
            </div>
            
            <div className="h-[600px] relative">
              {geoData.length > 0 ? (
                <GeographicHeatmap data={geoData} />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-500">No geographic data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Transfer Analysis</h2>
                </div>
              </div>
              
              <div className="h-[500px]">
                {transfersData.length > 0 ? (
                  <TransferAnalysis data={transfersData} maxItems={8} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No transfer data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Error Patterns</h2>
                </div>
              </div>
              
              <div className="h-[500px]">
                {errorsData.length > 0 ? (
                  <ErrorPatterns data={errorsData} maxItems={10} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No error data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
