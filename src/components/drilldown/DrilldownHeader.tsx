/**
 * DrilldownHeader Component
 * 
 * Header for drilldown modal with title, breadcrumb navigation, and actions
 */

'use client';

import { X, ArrowLeft, Home } from 'lucide-react';

interface BreadcrumbItem {
  level: number;
  label: string;
}

interface DrilldownHeaderProps {
  /** Title text */
  title: string;
  
  /** Optional subtitle */
  subtitle?: string;
  
  /** Close handler */
  onClose: () => void;
  
  /** Back navigation handler (undefined if at level 1) */
  onBack?: () => void;
  
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  
  /** Jump to level handler */
  onJumpToLevel?: (level: number) => void;
  
  /** Optional actions (buttons, filters, etc.) */
  actions?: React.ReactNode;
}

export default function DrilldownHeader({
  title,
  subtitle,
  onClose,
  onBack,
  breadcrumbs = [],
  onJumpToLevel,
  actions,
}: DrilldownHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700">
      {/* Main Header Row */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions + Close */}
          <div className="flex items-center gap-2 ml-4">
            {actions}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation (if multi-level) */}
      {breadcrumbs.length > 1 && (
        <div className="px-6 pb-3 pt-1">
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => onJumpToLevel?.(1)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Jump to overview"
            >
              <Home className="w-4 h-4" />
            </button>

            {breadcrumbs.map((item, index) => (
              <div key={item.level} className="flex items-center gap-2">
                <span className="text-gray-400">/</span>
                {index < breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => onJumpToLevel?.(item.level)}
                    className="text-gray-600 hover:text-gray-900 transition-colors hover:underline"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-gray-900 font-medium">
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
