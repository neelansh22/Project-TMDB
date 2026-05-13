'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface ErrorData {
  error_type: string;
  error_count: number;
  percentage: number;
  avg_sentiment_score: number;
  avg_duration_seconds: number;
  calls_with_error: number;
}

interface Props {
  data: ErrorData[];
  maxItems?: number;
}

const COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
];

const CustomContent = (props: any) => {
  const { x, y, width, height, index, name, value, percentage } = props;
  
  if (width < 60 || height < 40) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#1F2937',
          strokeWidth: 2,
          opacity: 0.9,
        }}
        className="hover:opacity-100 transition-opacity"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 10}
        textAnchor="middle"
        fill="#fff"
        fontSize={width < 100 ? 10 : 12}
        fontWeight="600"
      >
        {name.length > 15 ? name.slice(0, 15) + '...' : name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        fill="#fff"
        fontSize={width < 100 ? 12 : 16}
        fontWeight="700"
      >
        {percentage}%
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 24}
        textAnchor="middle"
        fill="#E5E7EB"
        fontSize={9}
      >
        {value} errors
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl max-w-xs">
        <p className="text-white font-semibold mb-3 text-base">{data.name}</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Error Count:</span>
            <span className="text-white font-semibold">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Percentage:</span>
            <span className="text-red-400 font-semibold">{data.percentage}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Calls Affected:</span>
            <span className="text-orange-400 font-semibold">{data.calls_with_error}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Avg Duration:</span>
            <span className="text-blue-400 font-semibold">
              {Math.floor(data.avg_duration_seconds / 60)}m {data.avg_duration_seconds % 60}s
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Sentiment:</span>
            <span className="text-purple-400 font-semibold">
              {data.avg_sentiment_score?.toFixed(2) || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ErrorPatterns({ data, maxItems = 10 }: Props) {
  const displayData = data.slice(0, maxItems).map(item => ({
    name: item.error_type,
    value: item.error_count,
    percentage: item.percentage.toFixed(1),
    avg_sentiment_score: item.avg_sentiment_score,
    avg_duration_seconds: item.avg_duration_seconds,
    calls_with_error: item.calls_with_error,
  }));

  const totalErrors = data.reduce((sum, item) => sum + item.error_count, 0);
  const avgSentiment = data.reduce((sum, item) => sum + (item.avg_sentiment_score || 0), 0) / data.length;
  const callsAffected = data.reduce((sum, item) => sum + item.calls_with_error, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Error & Misunderstanding Patterns</h3>
        <p className="text-sm text-gray-400">Common issues affecting call quality</p>
      </div>

      {/* Treemap */}
      <div className="flex-1 min-h-0 bg-gray-800/30 rounded-lg border border-gray-700">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={displayData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#1F2937"
            content={<CustomContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-400">
              {totalErrors.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Errors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">
              {callsAffected.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Calls Affected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {avgSentiment.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Sentiment</div>
          </div>
        </div>
      </div>
    </div>
  );
}
