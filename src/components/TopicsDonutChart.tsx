'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TopicData {
  intentName: string;
  intentCategory: string;
  callCount: number;
  percentage: string;
  avgConfidence: number;
}

interface TopicsDonutChartProps {
  data: TopicData[];
  maxItems?: number;
}

// Modern gradient color palette
const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Violet
  '#14b8a6', // Teal
];

export default function TopicsDonutChart({ data, maxItems = 8 }: TopicsDonutChartProps) {
  // Take top N items, group rest as "Others"
  const topItems = data.slice(0, maxItems);
  const others = data.slice(maxItems);
  
  const chartData = topItems.map((item) => ({
    name: item.intentName,
    value: item.callCount,
    percentage: parseFloat(item.percentage),
    category: item.intentCategory,
    confidence: item.avgConfidence
  }));

  if (others.length > 0) {
    const othersTotal = others.reduce((sum, item) => sum + item.callCount, 0);
    const othersPercentage = others.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
    chartData.push({
      name: 'Others',
      value: othersTotal,
      percentage: othersPercentage,
      category: 'Various',
      confidence: 0
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-1">{data.name}</p>
          <p className="text-gray-300 text-sm">Calls: {data.value.toLocaleString()}</p>
          <p className="text-gray-300 text-sm">Share: {data.percentage.toFixed(1)}%</p>
          {data.confidence > 0 && (
            <p className="text-gray-400 text-xs mt-1">
              Avg Confidence: {(data.confidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
