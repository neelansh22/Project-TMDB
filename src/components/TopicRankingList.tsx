'use client';

interface TopicData {
  intentName: string;
  intentCategory: string;
  intentDescription?: string;
  callCount: number;
  percentage: string;
  avgConfidence: number;
  totalOccurrences?: number;
}

interface TopicRankingListProps {
  data: TopicData[];
  maxItems?: number;
}

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'Order Management': 'bg-blue-500',
    'Customer Service': 'bg-purple-500',
    'Technical Support': 'bg-rose-500',
    'Billing': 'bg-amber-500',
    'General Inquiry': 'bg-emerald-500',
  };
  return colors[category] || 'bg-gray-500';
};

export default function TopicRankingList({ data, maxItems = 10 }: TopicRankingListProps) {
  const topItems = data.slice(0, maxItems);
  const maxCount = topItems[0]?.callCount || 1;

  return (
    <div className="space-y-3">
      {topItems.map((topic, index) => {
        const barWidth = (topic.callCount / maxCount) * 100;
        const confidence = topic.avgConfidence * 100;

        return (
          <div key={index} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-2xl font-bold text-gray-500 w-8 flex-shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                    {topic.intentName}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {topic.intentDescription || topic.intentCategory}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-lg font-bold text-white">
                  {topic.percentage}%
                </div>
                <div className="text-xs text-gray-400">
                  {topic.callCount.toLocaleString()} calls
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Background track */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                {/* Progress bar with gradient */}
                <div
                  className={`h-full ${getCategoryColor(topic.intentCategory)} transition-all duration-500 ease-out rounded-full`}
                  style={{ 
                    width: `${barWidth}%`,
                    opacity: 0.8 + (confidence / 500) // Slight opacity variation based on confidence
                  }}
                />
              </div>
              
              {/* Confidence indicator (optional subtle indicator) */}
              {confidence >= 70 && (
                <div 
                  className="absolute top-0 right-0 h-2 w-1 bg-green-400 rounded-full"
                  title={`${confidence.toFixed(0)}% confidence`}
                />
              )}
            </div>
            
            {/* Additional metrics on hover */}
            <div className="hidden group-hover:flex justify-between text-xs text-gray-500 mt-1 transition-all">
              <span>Occurrences: {topic.totalOccurrences.toLocaleString()}</span>
              <span>Confidence: {confidence.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
