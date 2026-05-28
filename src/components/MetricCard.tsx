import { Phone, CheckCircle, ArrowRightLeft, AlertTriangle, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { hasDrilldown } from '@/drilldowns/registry';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: 'phone' | 'check' | 'transfer' | 'alert' | 'clock' | 'message';
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  drilldownId?: string;
  onClick?: () => void;
}

const iconMap = {
  phone: Phone,
  check: CheckCircle,
  transfer: ArrowRightLeft,
  alert: AlertTriangle,
  clock: Clock,
  message: MessageCircle,
};

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  indigo: 'bg-indigo-100 text-indigo-600',
};

export default function MetricCard({ title, value, subtitle, icon, color, drilldownId, onClick }: MetricCardProps) {
  const Icon = iconMap[icon];
  const isDrilldownEnabled = drilldownId ? hasDrilldown(drilldownId) : false;
  const isClickable = isDrilldownEnabled && onClick;

  const handleClick = () => {
    if (isClickable) {
      onClick();
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${
        isClickable 
          ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5' 
          : 'hover:shadow-md'
      }`}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {isClickable && (
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {isClickable && (
        <div className="mt-3 text-xs font-medium text-blue-600">
          Click to explore →
        </div>
      )}
    </div>
  );
}
