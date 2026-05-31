/**
 * Transfer Drilldown - Level 1: Overview
 * 
 * Shows transfer reasons with bar/bubble visualization and breakdown list
 */

'use client';

import { useState } from 'react';
import { DrilldownLevelProps } from '@/types/drilldown';
import ImpactBubbles from '@/components/drilldown/visualizations/ImpactBubbles';
import TransferBarChart from '@/components/drilldown/visualizations/TransferBarChart';
import { ArrowRight, TrendingUp, TrendingDown, Minus, BarChart3, Sparkles } from 'lucide-react';

interface TransferReason {
  reasonId: string;
  reasonName: string;
  reasonCategory: string;
  reasonDescription: string;
  transferCount: number;
  percentage: number;
  resolutionRate: number;
  avgSentiment: number;
  avgTimeBeforeTransfer: number;
}

interface Level1Data {
  totalCalls: number;
  totalTransfers: number;
  transferRate: number;
  reasons: TransferReason[];
}

export default function TransferOverview({
  data,
  onDrill,
  isLoading,
}: DrilldownLevelProps<Level1Data>) {
  const [viewMode, setViewMode] = useState<'bar' | 'bubble'>('bar');

  if (!data || !data.reasons || data.reasons.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">
          {isLoading ? 'Loading transfer data...' : 'No transfer data available'}
        </div>
      </div>
    );
  }

  // Transform data for bubble chart
  const bubbleData = data.reasons.map((reason, index) => ({
    name: reason.reasonName,
    x: (index % 3) * 33 + 16.5, // Distribute horizontally in 3 columns
    y: reason.resolutionRate,    // Y = resolution rate (higher is better outcome)
    z: reason.transferCount,     // Size = frequency
    category: reason.reasonCategory,
    metadata: {
      percentage: `${reason.percentage.toFixed(1)}%`,
      sentiment: reason.avgSentiment.toFixed(2),
    },
  }));

  // Transform data for bar chart
  const barData = data.reasons.map((reason) => ({
    name: reason.reasonName,
    count: reason.transferCount,
    resolutionRate: reason.resolutionRate,
    category: reason.reasonCategory,
  }));

  const getSentimentIcon = (score: number) => {
    if (score >= 0.7) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score >= 0.4) return <Minus className="w-4 h-4 text-gray-400" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-lg p-4 border border-purple-700/30">
          <div className="text-sm text-purple-300 font-medium">Total Transfers</div>
          <div className="text-3xl font-bold text-purple-100 mt-1">
            {data.totalTransfers}
          </div>
          <div className="text-sm text-purple-400 mt-1">
            {data.transferRate}% of all calls
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg p-4 border border-blue-700/30">
          <div className="text-sm text-blue-300 font-medium">Transfer Reasons</div>
          <div className="text-3xl font-bold text-blue-100 mt-1">
            {data.reasons.length}
          </div>
          <div className="text-sm text-blue-400 mt-1">
            Unique categories
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-lg p-4 border border-green-700/30">
          <div className="text-sm text-green-300 font-medium">Avg Resolution Rate</div>
          <div className="text-3xl font-bold text-green-100 mt-1">
            {(data.reasons.reduce((sum, r) => sum + r.resolutionRate, 0) / data.reasons.length).toFixed(1)}%
          </div>
          <div className="text-sm text-green-400 mt-1">
            After transfer
          </div>
        </div>
      </div>

      {/* Visualization with Toggle */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Transfer Analysis</h3>
            <p className="text-sm text-gray-400 mt-1">
              {viewMode === 'bar' 
                ? 'Transfer count by reason with resolution rate color coding'
                : 'Bubble size = frequency | Y-axis = resolution rate after transfer'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('bar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode('bubble')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'bubble'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Bubble Chart
            </button>
          </div>
        </div>

        <div className="h-[500px] w-full">
          {viewMode === 'bar' ? (
            <TransferBarChart
              data={barData}
              onBarClick={(item) => {
                const reason = data.reasons.find(r => r.reasonName === item.name);
                if (reason) {
                  onDrill({ reasonId: reason.reasonId, reasonName: reason.reasonName });
                }
              }}
              showLabels
            />
          ) : (
            <ImpactBubbles
              data={bubbleData}
              onBubbleClick={(item) => {
                const reason = data.reasons.find(r => r.reasonName === item.name);
                if (reason) {
                  onDrill({ reasonId: reason.reasonId, reasonName: reason.reasonName });
                }
              }}
              colorScheme="impact"
              showLabels
            />
          )}
        </div>
      </div>

      {/* Transfer Reasons Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Transfer Reasons Breakdown
        </h3>
        <div className="space-y-3">
          {data.reasons.map((reason) => (
            <button
              key={reason.reasonId}
              onClick={() => onDrill({ reasonId: reason.reasonId, reasonName: reason.reasonName })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Reason Name and Category */}
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-white">{reason.reasonName}</h4>
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded font-medium">
                      {reason.reasonCategory}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400">{reason.reasonDescription}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Transfers:</span>
                      <span className="ml-2 font-semibold text-white">
                        {reason.transferCount}
                      </span>
                      <span className="ml-1 text-gray-500">
                        ({reason.percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400">Resolution:</span>
                      <span className={`ml-2 font-semibold ${
                        reason.resolutionRate >= 70 ? 'text-green-400' :
                        reason.resolutionRate >= 40 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {reason.resolutionRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Sentiment:</span>
                      {getSentimentIcon(reason.avgSentiment)}
                      <span className="font-semibold text-white">
                        {reason.avgSentiment.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400">Avg Time:</span>
                      <span className="ml-2 font-semibold text-white">
                        {Math.floor(reason.avgTimeBeforeTransfer / 60)}m {reason.avgTimeBeforeTransfer % 60}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
