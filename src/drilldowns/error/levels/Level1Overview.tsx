/**
 * Error Drilldown - Level 1: Overview
 * 
 * Shows error types with bar/bubble visualization and breakdown list
 */

'use client';

import { useState } from 'react';
import { DrilldownLevelProps } from '@/types/drilldown';
import ImpactBubbles from '@/components/drilldown/visualizations/ImpactBubbles';
import TransferBarChart from '@/components/drilldown/visualizations/TransferBarChart';
import { ArrowRight, TrendingUp, TrendingDown, Minus, BarChart3, Sparkles, AlertTriangle } from 'lucide-react';

interface ErrorType {
  errorType: string;
  errorCategory: string;
  errorDescription: string;
  errorCount: number;
  percentage: number;
  callsAffected: number;
  recoveryRate: number;
  avgSentiment: number;
  avgErrorsPerCall: number;
}

interface Level1Data {
  totalCalls: number;
  callsWithErrors: number;
  totalErrors: number;
  errorRate: number;
  errorTypes: ErrorType[];
}

export default function ErrorOverview({
  data,
  onDrill,
  isLoading,
}: DrilldownLevelProps<Level1Data>) {
  const [viewMode, setViewMode] = useState<'bar' | 'bubble'>('bar');

  if (!data || !data.errorTypes || data.errorTypes.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">
          {isLoading ? 'Loading error data...' : 'No error data available'}
        </div>
      </div>
    );
  }

  // Transform data for bubble chart
  const bubbleData = data.errorTypes.map((error, index) => ({
    name: error.errorType,
    x: (index % 3) * 33 + 16.5, // Distribute horizontally in 3 columns
    y: error.recoveryRate,       // Y = recovery rate (higher is better)
    z: error.errorCount,          // Size = frequency
    category: error.errorCategory,
    metadata: {
      percentage: `${error.percentage.toFixed(1)}%`,
      callsAffected: `${error.callsAffected}`,
    },
  }));

  // Transform data for bar chart
  const barData = data.errorTypes.map((error) => ({
    name: error.errorType,
    count: error.errorCount,
    resolutionRate: error.recoveryRate,
    category: error.errorCategory,
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
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-lg p-4 border border-red-700/30">
          <div className="text-sm text-red-300 font-medium">Total Errors</div>
          <div className="text-3xl font-bold text-red-100 mt-1">
            {data.totalErrors}
          </div>
          <div className="text-sm text-red-400 mt-1">
            {data.errorRate}% of all calls
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 rounded-lg p-4 border border-orange-700/30">
          <div className="text-sm text-orange-300 font-medium">Error Types</div>
          <div className="text-3xl font-bold text-orange-100 mt-1">
            {data.errorTypes.length}
          </div>
          <div className="text-sm text-orange-400 mt-1">
            Unique patterns
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 rounded-lg p-4 border border-yellow-700/30">
          <div className="text-sm text-yellow-300 font-medium">Avg Recovery Rate</div>
          <div className="text-3xl font-bold text-yellow-100 mt-1">
            {(data.errorTypes.reduce((sum, e) => sum + e.recoveryRate, 0) / data.errorTypes.length).toFixed(1)}%
          </div>
          <div className="text-sm text-yellow-400 mt-1">
            After error
          </div>
        </div>
      </div>

      {/* Visualization with Toggle */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Error Analysis</h3>
            <p className="text-sm text-gray-400 mt-1">
              {viewMode === 'bar' 
                ? 'Error count by type with recovery rate color coding'
                : 'Bubble size = frequency | Y-axis = recovery rate after error'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('bar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'bar'
                  ? 'bg-red-600 text-white'
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
                  ? 'bg-red-600 text-white'
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
                const error = data.errorTypes.find(e => e.errorType === item.name);
                if (error) {
                  onDrill({ errorType: error.errorType });
                }
              }}
              showLabels
            />
          ) : (
            <ImpactBubbles
              data={bubbleData}
              onBubbleClick={(item) => {
                const error = data.errorTypes.find(e => e.errorType === item.name);
                if (error) {
                  onDrill({ errorType: error.errorType });
                }
              }}
              colorScheme="impact"
              showLabels
            />
          )}
        </div>
      </div>

      {/* Error Types Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Error Types Breakdown
        </h3>
        <div className="space-y-3">
          {data.errorTypes.map((error, index) => (
            <button
              key={index}
              onClick={() => onDrill({ errorType: error.errorType })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Error Type and Category */}
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <h4 className="font-semibold text-white">{error.errorType}</h4>
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded font-medium">
                      {error.errorCategory}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400">{error.errorDescription}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Errors:</span>
                      <span className="ml-2 font-semibold text-white">
                        {error.errorCount}
                      </span>
                      <span className="ml-1 text-gray-500">
                        ({error.percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400">Calls Affected:</span>
                      <span className="ml-2 font-semibold text-white">
                        {error.callsAffected}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400">Recovery:</span>
                      <span className={`ml-2 font-semibold ${
                        error.recoveryRate >= 70 ? 'text-green-400' :
                        error.recoveryRate >= 40 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {error.recoveryRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Sentiment:</span>
                      {getSentimentIcon(error.avgSentiment)}
                      <span className="font-semibold text-white">
                        {error.avgSentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-red-400 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
