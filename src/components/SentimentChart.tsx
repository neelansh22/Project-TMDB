'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface SentimentData {
  callDate: string;
  totalCalls: number;
  positiveSentimentRate: number;
  negativeSentimentRate: number;
  improvementRate: number;
}

export default function SentimentChart() {
  const [data, setData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async () => {
    try {
      const response = await fetch('/api/sentiment/trends');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch sentiment data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading sentiment data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No sentiment data available
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: format(parseISO(item.callDate), 'MMM dd'),
    positive: item.positiveSentimentRate,
    negative: item.negativeSentimentRate,
    improvement: item.improvementRate,
    calls: item.totalCalls,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.date}</p>
                  <p className="text-sm text-gray-600 mb-2">Calls: {payload[0].payload.calls}</p>
                  {payload.map((entry: any) => (
                    <p key={entry.name} style={{ color: entry.color }} className="text-sm">
                      {entry.name}: {entry.value?.toFixed(1)}%
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="positive"
          stroke="#10b981"
          strokeWidth={2}
          name="Positive Sentiment"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke="#ef4444"
          strokeWidth={2}
          name="Negative Sentiment"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="improvement"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Sentiment Improvement"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
