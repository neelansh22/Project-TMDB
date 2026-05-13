import { Phone, CheckCircle, ArrowRightLeft, AlertTriangle, Clock, MessageCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: 'phone' | 'check' | 'transfer' | 'alert' | 'clock' | 'message';
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
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

export default function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
