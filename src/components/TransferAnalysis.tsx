'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TransferData {
  transfer_reason: string;
  transfer_count: number;
  percentage: number;
  avg_sentiment_score: number;
  resolution_after_transfer_rate: number;
}

interface Props {
  data: TransferData[];
  maxItems?: number;
}

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{data.transfer_reason}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-300">
            Transfers: <span className="text-white font-semibold">{data.transfer_count}</span>
          </p>
          <p className="text-gray-300">
            Percentage: <span className="text-purple-400 font-semibold">{data.percentage}%</span>
          </p>
          <p className="text-gray-300">
            Resolution Rate: <span className="text-green-400 font-semibold">
              {data.resolution_after_transfer_rate?.toFixed(1) || 0}%
            </span>
          </p>
          <p className="text-gray-300">
            Sentiment: <span className="text-blue-400 font-semibold">
              {data.avg_sentiment_score?.toFixed(2) || 'N/A'}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function TransferAnalysis({ data, maxItems = 8 }: Props) {
  const displayData = data.slice(0, maxItems);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Transfer Reasons</h3>
        <p className="text-sm text-gray-400">Why calls are being transferred</p>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              type="number" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              dataKey="transfer_reason" 
              type="category"
              width={150}
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(value) => value.length > 20 ? value.slice(0, 20) + '...' : value}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.1 }} />
            <Bar 
              dataKey="transfer_count" 
              radius={[0, 4, 4, 0]}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {data.reduce((sum, item) => sum + item.transfer_count, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Transfers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {(data.reduce((sum, item) => sum + (item.resolution_after_transfer_rate || 0), 0) / data.length).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Resolution</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {data.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Unique Reasons</div>
          </div>
        </div>
      </div>
    </div>
  );
}
