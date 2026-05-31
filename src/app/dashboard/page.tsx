'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MetricCard from '@/components/MetricCard';
import SentimentChart from '@/components/SentimentChart';
import DrilldownModal from '@/components/drilldown/DrilldownModal';
import { getDrilldownConfig } from '@/drilldowns/registry';
import { RefreshCw } from 'lucide-react';

interface MetricsSummary {
  totalCalls: number;
  completedCalls: number;
  completionRate: number;
  resolvedCalls: number;
  resolutionRate: number;
  transferredCalls: number;
  transferRate: number;
  droppedCalls: number;
  dropRate: number;
  avgDurationSeconds: number;
  avgTurnsPerCall: number;
  callsWithErrors: number;
  totalErrors: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDrilldown, setActiveDrilldown] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMetrics();
    }
  }, [session]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/metrics/summary');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      setError('Failed to connect to API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar userEmail={session?.user?.email} />
      
      <div className="flex-1">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
              <p className="text-sm text-gray-400">Key performance indicators at a glance</p>
            </div>
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {metrics && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Calls"
                value={metrics.totalCalls.toLocaleString()}
                icon="phone"
                color="blue"
              />
              <MetricCard
                title="Resolution Rate"
                value={`${metrics.resolutionRate}%`}
                subtitle={`${metrics.resolvedCalls.toLocaleString()} resolved`}
                icon="check"
                color="green"
              />
              <MetricCard
                title="Transfer Rate"
                value={`${metrics.transferRate}%`}
                subtitle={`${metrics.transferredCalls.toLocaleString()} transferred`}
                icon="transfer"
                drilldownId="transfer-rate"
                onClick={() => setActiveDrilldown('transfer-rate')}
                color="yellow"
              />
              <MetricCard
                title="Drop Rate"
                value={`${metrics.dropRate}%`}
                subtitle={`${metrics.droppedCalls.toLocaleString()} dropped`}
                icon="alert"
                color="red"
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Avg Duration"
                value={`${Math.round(metrics.avgDurationSeconds / 60)} min`}
                subtitle={`${Math.round(metrics.avgDurationSeconds)} seconds`}
                icon="clock"
                color="purple"
              />
              <MetricCard
                title="Avg Turns per Call"
                value={metrics.avgTurnsPerCall.toFixed(1)}
                icon="message"
                color="indigo"
              />
              <MetricCard
                title="Calls with Errors"
                value={metrics.callsWithErrors.toLocaleString()}
                subtitle={`${metrics.totalErrors.toLocaleString()} total errors`}
                icon="alert"
                color="red"
                drilldownId="error-rate"
                onClick={() => setActiveDrilldown('error-rate')}
              />
            </div>

            {/* Sentiment Chart */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Sentiment Trends</h2>
              <SentimentChart />
            </div>
          </>
        )}

      {/* Drilldown Modal */}
      {activeDrilldown && (
        <DrilldownModal
          isOpen={true}
          onClose={() => setActiveDrilldown(null)}
          config={getDrilldownConfig(activeDrilldown)!}
        />
      )}
        </main>
      </div>
    </div>
  );
}
