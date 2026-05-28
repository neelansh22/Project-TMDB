/**
 * ImpactBubbles Component
 * 
 * Bubble chart visualization for impact clusters.
 * Used for showing transfer reasons, error types, etc. grouped by frequency and impact.
 */

'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BubbleData {
  name: string;
  x: number;  // Position X (can be category index)
  y: number;  // Position Y (impact score, resolution rate, etc.)
  z: number;  // Size (frequency, count)
  category?: string;
  metadata?: Record<string, any>;
}

interface ImpactBubblesProps {
  data: BubbleData[];
  onBubbleClick?: (item: BubbleData) => void;
  colorScheme?: 'impact' | 'category' | 'gradient';
  showLabels?: boolean;
}

// Color schemes
const IMPACT_COLORS = {
  high: '#EF4444',    // Red - high impact/low resolution
  medium: '#F59E0B',  // Orange - medium impact
  low: '#10B981',     // Green - low impact/high resolution
};

const CATEGORY_COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Orange
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EF4444', // Red
];

export default function ImpactBubbles({
  data,
  onBubbleClick,
  colorScheme = 'impact',
  showLabels = true,
}: ImpactBubblesProps) {
  // Determine color for each bubble
  const getColor = (item: BubbleData, index: number) => {
    if (colorScheme === 'impact') {
      // Color based on Y value (resolution rate, sentiment, etc.)
      if (item.y >= 70) return IMPACT_COLORS.low;  // High resolution = low impact (green)
      if (item.y >= 40) return IMPACT_COLORS.medium;
      return IMPACT_COLORS.high;  // Low resolution = high impact (red)
    }
    
    if (colorScheme === 'category' && item.category) {
      const categoryIndex = data.findIndex(d => d.category === item.category);
      return CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length];
    }
    
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{data.name}</p>
          {data.category && (
            <p className="text-gray-300 text-sm mb-1">Category: {data.category}</p>
          )}
          <p className="text-gray-300 text-sm">
            Count: <span className="text-white font-semibold">{data.z}</span>
          </p>
          <p className="text-gray-300 text-sm">
            Impact Score: <span className="text-white font-semibold">{data.y}%</span>
          </p>
          {data.metadata && Object.entries(data.metadata).map(([key, value]) => (
            <p key={key} className="text-gray-300 text-sm">
              {key}: <span className="text-white font-semibold">{String(value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="Position"
            tick={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Impact"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={[0, 100]}
            label={{ value: 'Resolution Rate %', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
          />
          <ZAxis
            type="number"
            dataKey="z"
            range={[400, 4000]}
            name="Count"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          <Scatter
            data={data}
            onClick={(item) => onBubbleClick?.(item)}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry, index)}
                fillOpacity={0.8}
                className="hover:fill-opacity-100 transition-all"
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      {showLabels && (
        <div className="mt-4 flex flex-wrap gap-6 justify-center text-sm">
          {data.slice(0, 6).map((item, index) => (
            <button
              key={index}
              onClick={() => onBubbleClick?.(item)}
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColor(item, index) }}
              />
              <span className="text-gray-700 font-medium">{item.name}</span>
              <span className="text-gray-500">({item.z})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
