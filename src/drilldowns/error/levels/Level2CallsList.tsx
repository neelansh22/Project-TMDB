/**
 * Error Drilldown - Level 2: Calls by Error Type
 * 
 * Shows list of calls that experienced a specific error type
 */

'use client';

import { DrilldownLevelProps, DrilldownCallData } from '@/types/drilldown';
import { AlertTriangle } from 'lucide-react';

interface Level2Data {
  errorType: string;
  errorCategory: string;
  errorDescription: string;
  errorCount: number;
  calls: DrilldownCallData[];
}

export default function ErrorCallsList({
  data,
  onDrill,
  isLoading,
}: DrilldownLevelProps<Level2Data>) {
  if (!data || !data.calls) return null;

  // Calculate summary stats
  const calls = data.calls || [];
  const avgErrors = calls.length > 0 
    ? calls.reduce((sum, c) => sum + (c.metadata?.errorCount || 0), 0) / calls.length 
    : 0;
  const recoveredCount = calls.filter(c => c.successfulResolution).length;
  const avgDuration = calls.length > 0 ? calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length : 0;

  return (
    <div className="space-y-6">
      {/* Context Header */}
      <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border-b border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">{data.errorType}</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-700 border border-gray-600 text-gray-300 rounded font-medium">
                {data.errorCategory}
              </span>
            </div>
            <p className="text-sm text-gray-300">{data.errorDescription}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Total Calls</div>
            <div className="text-2xl font-bold text-white mt-1">{calls.length}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Avg Errors/Call</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {avgErrors.toFixed(1)}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Recovered</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {recoveredCount}
              <span className="text-sm text-gray-400 ml-2">
                ({calls.length > 0 ? ((recoveredCount / calls.length) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Avg Duration</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.floor(avgDuration / 60)}m
            </div>
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700 bg-gray-900">
              <tr className="text-left">
                <th className="py-3 px-4 font-semibold text-gray-300">Date</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Channel</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Duration</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Turns</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Errors</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Sentiment Journey</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Outcome</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No calls found with this error type
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr
                    key={call.callId}
                    className="hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(call.callDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        call.channel === 'phone' ? 'bg-blue-900 text-blue-300' :
                        call.channel === 'web' ? 'bg-green-900 text-green-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {call.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {Math.floor((call.duration || 0) / 60)}m {(call.duration || 0) % 60}s
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {call.totalTurns || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">
                        {call.metadata?.errorCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">
                      {call.initialSentiment || 'Unknown'} → {call.finalSentiment || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        call.resolutionStatus === 'Resolved' ? 'bg-green-900 text-green-300' :
                        call.resolutionStatus === 'Unresolved' ? 'bg-red-900 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {call.resolutionStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onDrill({ callId: call.callId })}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        View Chat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
