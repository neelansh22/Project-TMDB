/**
 * Transfer Drilldown - Level 2: Calls by Reason
 * 
 * Shows list of calls that were transferred for a specific reason
 */

'use client';

import { DrilldownLevelProps, DrilldownCallData } from '@/types/drilldown';

interface Level2Data {
  reasonName: string;
  reasonCategory: string;
  reasonDescription: string;
  transferCount: number;
  calls: DrilldownCallData[];
}

export default function TransferCallsList({
  data,
  onDrill,
  isLoading,
}: DrilldownLevelProps<Level2Data>) {
  if (!data || !data.calls) return null;

  // Calculate summary stats
  const calls = data.calls || [];
  const resolvedCount = calls.filter(c => c.resolutionStatus === 'Resolved').length;
  const avgDuration = calls.length > 0 ? calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length : 0;
  const avgTimeToTransfer = calls.length > 0 ? calls.reduce((sum, c) => sum + (c.metadata?.timeBeforeTransfer || 0), 0) / calls.length : 0;

  return (
    <div className="space-y-6">
      {/* Context Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">{data.reasonName}</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-700 border border-gray-600 text-gray-300 rounded font-medium">
                {data.reasonCategory}
              </span>
            </div>
            <p className="text-sm text-gray-300">{data.reasonDescription}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Total Calls</div>
            <div className="text-2xl font-bold text-white mt-1">{data.transferCount}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Resolved</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {resolvedCount}
              <span className="text-sm text-gray-400 ml-2">
                ({calls.length > 0 ? ((resolvedCount / calls.length) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Avg Duration</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.floor(avgDuration / 60)}m
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 font-medium">Avg Time to Transfer</div>
            <div className="text-2xl font-bold text-white mt-1">
              {Math.floor(avgTimeToTransfer / 60)}m {avgTimeToTransfer % 60}s
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
                <th className="py-3 px-4 font-semibold text-gray-300">Sentiment Journey</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Outcome</th>
                <th className="py-3 px-4 font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No calls found for this transfer reason
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.callId} className="hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4 text-white">
                      {call.callDate ? new Date(call.callDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-900/40 text-blue-400 rounded text-xs font-medium">
                        {call.channel || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">
                      {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {call.totalTurns || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">
                        {call.initialSentiment || 'Unknown'} → {call.finalSentiment || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        call.resolutionStatus === 'Resolved'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}>
                        {call.resolutionStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          console.log('Drilling to call:', call.callId);
                          onDrill({ callId: call.callId });
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
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
