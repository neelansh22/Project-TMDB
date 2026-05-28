/**
 * DrilldownError Component
 * 
 * Error display for drilldown failures
 */

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface DrilldownErrorProps {
  /** Error message */
  message?: string;
  
  /** Retry handler */
  onRetry?: () => void;
}

export default function DrilldownError({
  message = 'Failed to load data',
  onRetry,
}: DrilldownErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
