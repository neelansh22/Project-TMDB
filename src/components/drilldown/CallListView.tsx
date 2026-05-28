/**
 * CallListView Component
 * 
 * Generic, reusable component for displaying lists of calls in drilldown views.
 * Used across all drilldowns to maintain consistent UX.
 */

'use client';

import { Phone, Clock, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { DataFieldConfig, DrilldownCallData } from '@/types/drilldown';

interface CallListViewProps {
  /** List of calls to display */
  calls: DrilldownCallData[];
  
  /** Fields to display for each call */
  fields: DataFieldConfig[];
  
  /** Click handler when call is clicked */
  onCallClick: (callId: string) => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Layout variant */
  variant?: 'list' | 'grid' | 'compact';
}

export default function CallListView({
  calls,
  fields,
  onCallClick,
  isLoading = false,
  emptyMessage = 'No calls found',
  variant = 'list',
}: CallListViewProps) {
  if (isLoading) {
    return <LoadingSkeleton variant={variant} />;
  }

  if (calls.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  if (variant === 'grid') {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calls.map((call) => (
          <CallCard
            key={call.callId}
            call={call}
            fields={fields}
            onClick={() => onCallClick(call.callId)}
          />
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="divide-y divide-gray-200">
        {calls.map((call) => (
          <CallRowCompact
            key={call.callId}
            call={call}
            fields={fields}
            onClick={() => onCallClick(call.callId)}
          />
        ))}
      </div>
    );
  }

  // Default: list variant
  return (
    <div className="p-6 space-y-3">
      {calls.map((call) => (
        <CallRow
          key={call.callId}
          call={call}
          fields={fields}
          onClick={() => onCallClick(call.callId)}
        />
      ))}
    </div>
  );
}

/**
 * Full call row (default list view)
 */
function CallRow({
  call,
  fields,
  onClick,
}: {
  call: DrilldownCallData;
  fields: DataFieldConfig[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Call Info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Call ID and Channel */}
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900">{call.callId}</span>
            <span className="text-sm text-gray-500 capitalize">{call.channel}</span>
          </div>

          {/* Dynamic fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {fields.slice(0, 4).map((field) => (
              <FieldDisplay key={field.key} field={field} call={call} />
            ))}
          </div>
        </div>

        {/* Right: Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

/**
 * Compact call row
 */
function CallRowCompact({
  call,
  fields,
  onClick,
}: {
  call: DrilldownCallData;
  fields: DataFieldConfig[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left group flex items-center justify-between"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="font-medium text-gray-900 truncate">{call.callId}</span>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {fields.slice(0, 2).map((field) => (
            <FieldDisplay key={field.key} field={field} call={call} compact />
          ))}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
    </button>
  );
}

/**
 * Call card (grid view)
 */
function CallCard({
  call,
  fields,
  onClick,
}: {
  call: DrilldownCallData;
  fields: DataFieldConfig[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900 truncate">{call.callId}</span>
        </div>

        <div className="space-y-2 text-sm">
          {fields.slice(0, 4).map((field) => (
            <FieldDisplay key={field.key} field={field} call={call} />
          ))}
        </div>
      </div>
    </button>
  );
}

/**
 * Display a single field value
 */
function FieldDisplay({
  field,
  call,
  compact = false,
}: {
  field: DataFieldConfig;
  call: DrilldownCallData;
  compact?: boolean;
}) {
  const value = (call as any)[field.key];
  
  if (value === undefined || value === null) return null;

  // Use custom format if provided
  if (field.format) {
    const formatted = field.format(value, call);
    return (
      <div className={compact ? 'inline-flex items-center gap-1' : 'flex items-center gap-2'}>
        {field.icon && <field.icon className={compact ? 'w-3 h-3' : 'w-4 h-4 text-gray-400'} />}
        {compact ? (
          <span>{formatted}</span>
        ) : (
          <>
            <span className="text-gray-600">{field.label}:</span>
            <span className="text-gray-900 font-medium">{formatted}</span>
          </>
        )}
      </div>
    );
  }

  // Default formatting based on type
  let formattedValue: React.ReactNode = value;
  let icon: React.ReactNode = null;

  switch (field.type) {
    case 'duration':
      const seconds = parseInt(String(value));
      const minutes = Math.floor(seconds / 60);
      formattedValue = `${minutes}m ${seconds % 60}s`;
      icon = <Clock className={compact ? 'w-3 h-3' : 'w-4 h-4 text-gray-400'} />;
      break;

    case 'sentiment':
      const sentimentLower = String(value).toLowerCase();
      if (sentimentLower.includes('positive') || sentimentLower.includes('happy') || sentimentLower.includes('satisfied')) {
        icon = <TrendingUp className="w-4 h-4 text-green-500" />;
      } else if (sentimentLower.includes('negative') || sentimentLower.includes('stressed') || sentimentLower.includes('frustrated')) {
        icon = <TrendingDown className="w-4 h-4 text-red-500" />;
      } else {
        icon = <Minus className="w-4 h-4 text-gray-400" />;
      }
      formattedValue = value;
      break;

    case 'status':
      const status = String(value);
      const statusColor = 
        status === 'Resolved' ? 'text-green-700 bg-green-100' :
        status === 'Unresolved' ? 'text-red-700 bg-red-100' :
        'text-gray-700 bg-gray-100';
      formattedValue = (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
          {status}
        </span>
      );
      break;

    case 'percentage':
      formattedValue = `${value}%`;
      break;

    case 'number':
      formattedValue = Number(value).toLocaleString();
      break;
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        {icon}
        <span>{formattedValue}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {icon || (field.icon && <field.icon className="w-4 h-4 text-gray-400" />)}
      <span className="text-gray-600">{field.label}:</span>
      <span className="text-gray-900 font-medium">{formattedValue}</span>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton({ variant }: { variant: string }) {
  const count = variant === 'grid' ? 6 : 4;
  
  return (
    <div className="p-6 space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
      ))}
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <div className="text-center">
        <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
