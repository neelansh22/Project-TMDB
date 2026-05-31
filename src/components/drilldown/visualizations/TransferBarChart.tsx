/**
 * Transfer Bar Chart Component
 * 
 * Simple bar chart for transfer reasons - better for low volume data
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarData {
  name: string;
  count: number;
  resolutionRate: number;
  category: string;
}

interface TransferBarChartProps {
  data: BarData[];
  onBarClick?: (item: BarData) => void;
  showLabels?: boolean;
}

export default function TransferBarChart({
  data,
  onBarClick,
  showLabels = true,
}: TransferBarChartProps) {
  const getColor = (rate: number) => {
    if (rate >= 70) return '#10b981'; // green
    if (rate >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold mb-2">{data.name}</p>
          <p className="text-sm text-gray-300">
            Transfers: <span className="text-white font-semibold">{data.count}</span>
          </p>
          <p className="text-sm text-gray-300">
            Resolution Rate: <span className="text-white font-semibold">{data.resolutionRate.toFixed(1)}%</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{data.category}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Transfer Count', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }} />
          <Bar
            dataKey="count"
            onClick={(data) => onBarClick?.(data)}
            cursor="pointer"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.resolutionRate)}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      {showLabels && (
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-gray-300">High Resolution (≥70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-gray-300">Medium Resolution (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-gray-300">Low Resolution (&lt;40%)</span>
          </div>
        </div>
      )}
    </div>
  );
}
