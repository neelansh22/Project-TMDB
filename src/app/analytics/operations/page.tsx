'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface TransferData {
  reasonCategory: string;
  reasonDetail: string;
  severityLevel: string;
  transferCount: number;
  percentageOfTransfers: number;
  avgDurationSeconds: number;
}

interface ErrorData {
  callDate: string;
  totalCalls: number;
  callsWithErrors: number;
  errorRate: number;
  totalErrorCount: number;
  callsWithMisunderstandings: number;
  misunderstandingRate: number;
  callsWithUnsupportedScenarios: number;
  unsupportedScenarioRate: number;
}

interface ErrorSummary {
  totalCalls: number;
  callsWithErrors: number;
  errorRate: string;
  totalErrorCount: number;
  callsWithMisunderstandings: number;
  misunderstandingRate: string;
  callsWithUnsupportedScenarios: number;
  unsupportedScenarioRate: string;
}

const SEVERITY_COLORS: { [key: string]: string } = {
  'High': '#ef4444',
  'Medium': '#f59e0b',
  'Low': '#10b981'
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function OperationsPage() {
  const { data: session, status } = useSession();
  const [transferData, setTransferData] = useState<TransferData[]>([]);
  const [errorData, setErrorData] = useState<ErrorData[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [transfersResponse, errorsResponse] = await Promise.all([
        fetch('/api/analytics/transfers'),
        fetch('/api/analytics/errors')
      ]);

      const transfersResult = await transfersResponse.json();
      const errorsResult = await errorsResponse.json();

      if (transfersResult.success) {
        setTransferData(transfersResult.data);
      }

      if (errorsResult.success) {
        setErrorData(errorsResult.data);
        setErrorSummary(errorsResult.summary);
      }

      if (!transfersResult.success || !errorsResult.success) {
        setError('Failed to fetch some data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar userEmail={session?.user?.email} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading operations data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar userEmail={session?.user?.email} />
        <div className="flex-1 p-8">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Operations Data</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data for transfers
  const transferChartData = transferData.slice(0, 10).map(t => ({
    name: t.reasonDetail.length > 30 ? t.reasonDetail.substring(0, 30) + '...' : t.reasonDetail,
    count: t.transferCount,
    percentage: t.percentageOfTransfers,
    severity: t.severityLevel
  }));

  // Prepare pie chart for error types
  const errorTypeData = errorSummary ? [
    { name: 'Errors', value: errorSummary.callsWithErrors, color: '#ef4444' },
    { name: 'Misunderstandings', value: errorSummary.callsWithMisunderstandings, color: '#f59e0b' },
    { name: 'Unsupported', value: errorSummary.callsWithUnsupportedScenarios, color: '#8b5cf6' }
  ] : [];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar userEmail={session?.user?.email} />
      
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Operations Insights</h1>
              <p className="text-gray-400">
                Transfer patterns and quality issues analysis
              </p>
            </div>
            <button
              onClick={fetchData}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
        {/* Error Summary Cards */}
        {errorSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Calls</div>
              <div className="text-2xl font-bold text-blue-400">
                {errorSummary.totalCalls.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-900 border border-red-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Error Rate</div>
              <div className="text-2xl font-bold text-red-400">
                {errorSummary.errorRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {errorSummary.callsWithErrors} calls
              </div>
            </div>
            <div className="bg-gray-900 border border-amber-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Misunderstanding Rate</div>
              <div className="text-2xl font-bold text-amber-400">
                {errorSummary.misunderstandingRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {errorSummary.callsWithMisunderstandings} calls
              </div>
            </div>
            <div className="bg-gray-900 border border-purple-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Unsupported Rate</div>
              <div className="text-2xl font-bold text-purple-400">
                {errorSummary.unsupportedScenarioRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {errorSummary.callsWithUnsupportedScenarios} calls
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transfer Reasons Bar Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Top Transfer Reasons</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={transferChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#9ca3af"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [value.toLocaleString(), 'Transfers'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Error Types Pie Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Quality Issues Breakdown</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={errorTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {errorTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transfer Details Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Transfer Reasons Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-left">
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Severity</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Category</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Reason</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Count</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">% of Transfers</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transferData.map((transfer, index) => (
                  <tr key={index} className="hover:bg-gray-850 transition-colors">
                    <td className="py-3 pr-4">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${SEVERITY_COLORS[transfer.severityLevel]}20`,
                          color: SEVERITY_COLORS[transfer.severityLevel]
                        }}
                      >
                        {transfer.severityLevel}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{transfer.reasonCategory}</td>
                    <td className="py-3 pr-4 text-white">{transfer.reasonDetail}</td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {transfer.transferCount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right text-rose-400 font-bold">
                      {transfer.percentageOfTransfers.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-400">
                      {Math.round(transfer.avgDurationSeconds / 60)}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Trends Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quality Issues by Date</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-left">
                  <th className="pb-3 pr-4 font-semibold text-gray-400">Date</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Total Calls</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Errors</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Error Rate</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Misunderstandings</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-400 text-right">Unsupported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {errorData.slice(0, 10).map((error, index) => (
                  <tr key={index} className="hover:bg-gray-850 transition-colors">
                    <td className="py-3 pr-4 text-white">
                      {new Date(error.callDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {error.totalCalls.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-right text-red-400">
                      {error.callsWithErrors}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className={`${
                        error.errorRate > 20 ? 'text-red-400' :
                        error.errorRate > 10 ? 'text-yellow-400' :
                        'text-green-400'
                      } font-bold`}>
                        {error.errorRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-amber-400">
                      {error.callsWithMisunderstandings}
                    </td>
                    <td className="py-3 pr-4 text-right text-purple-400">
                      {error.callsWithUnsupportedScenarios}
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
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
