/**
 * Transfer Drilldown - Level 1: Overview
 * 
 * Shows transfer reasons with bubble visualization and breakdown list
 */

'use client';

import { DrilldownLevelProps } from '@/types/drilldown';
import ImpactBubbles from '@/components/drilldown/visualizations/ImpactBubbles';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  if (!data) return null;

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

  const getSentimentIcon = (score: number) => {
    if (score >= 0.7) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score >= 0.4) return <Minus className="w-4 h-4 text-gray-400" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-sm text-purple-700 font-medium">Total Transfers</div>
          <div className="text-3xl font-bold text-purple-900 mt-1">
            {data.totalTransfers}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            {data.transferRate}% of all calls
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-sm text-blue-700 font-medium">Transfer Reasons</div>
          <div className="text-3xl font-bold text-blue-900 mt-1">
            {data.reasons.length}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Unique categories
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-sm text-green-700 font-medium">Avg Resolution Rate</div>
          <div className="text-3xl font-bold text-green-900 mt-1">
            {(data.reasons.reduce((sum, r) => sum + r.resolutionRate, 0) / data.reasons.length).toFixed(1)}%
          </div>
          <div className="text-sm text-green-600 mt-1">
            After transfer
          </div>
        </div>
      </div>

      {/* Bubble Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transfer Impact Clusters</h3>
          <p className="text-sm text-gray-600 mt-1">
            Bubble size = frequency | Y-axis = resolution rate after transfer
          </p>
        </div>
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
      </div>

      {/* Transfer Reasons Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transfer Reasons Breakdown
        </h3>
        <div className="space-y-3">
          {data.reasons.map((reason) => (
            <button
              key={reason.reasonId}
              onClick={() => onDrill({ reasonId: reason.reasonId, reasonName: reason.reasonName })}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Reason Name and Category */}
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{reason.reasonName}</h4>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">
                      {reason.reasonCategory}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600">{reason.reasonDescription}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Transfers:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {reason.transferCount}
                      </span>
                      <span className="ml-1 text-gray-500">
                        ({reason.percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-600">Resolution:</span>
                      <span className={`ml-2 font-semibold ${
                        reason.resolutionRate >= 70 ? 'text-green-700' :
                        reason.resolutionRate >= 40 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {reason.resolutionRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Sentiment:</span>
                      {getSentimentIcon(reason.avgSentiment)}
                      <span className="font-semibold text-gray-900">
                        {reason.avgSentiment.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {Math.floor(reason.avgTimeBeforeTransfer / 60)}m {reason.avgTimeBeforeTransfer % 60}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
