/**
 * DrilldownModal Component
 * 
 * Generic modal container for drilldown experiences.
 * Manages navigation state and renders appropriate level components.
 */

'use client';

import { useEffect, useMemo } from 'react';
import { DrilldownConfig, DrilldownModalProps } from '@/types/drilldown';
import { useDrilldownNavigation } from '@/hooks/useDrilldownNavigation';
import { useDrilldownData } from '@/hooks/useDrilldownData';
import DrilldownHeader from './DrilldownHeader';
import DrilldownLoader from './DrilldownLoader';
import DrilldownError from './DrilldownError';

export default function DrilldownModal({
  isOpen,
  onClose,
  config,
  initialData,
  initialFilters = {},
}: DrilldownModalProps) {
  const { state, actions } = useDrilldownNavigation({
    maxLevels: config.levels.count,
    initialLevel: 1,
    initialFilters,
    onLevelChange: (level, filters) => {
      console.log(`Navigated to level ${level}`, filters);
    },
  });

  // Get current level config
  const currentLevelConfig = config.levels.configs[state.currentLevel - 1];

  // Build API endpoint for current level
  const currentEndpoint = useMemo(() => {
    switch (state.currentLevel) {
      case 1:
        return config.api.level1;
      case 2:
        return config.api.level2(state.filters);
      case 3:
        return config.api.level3 ? config.api.level3(state.filters) : '';
      case 4:
        return config.api.level4 ? config.api.level4(state.filters) : '';
      default:
        return '';
    }
  }, [state.currentLevel, state.filters, config.api]);

  // Fetch data for current level
  const { data, isLoading, error, refetch } = useDrilldownData({
    endpoint: currentEndpoint,
    enabled: isOpen && !!currentEndpoint,
    filters: state.filters,
    cacheKey: `${config.id}-level${state.currentLevel}-${JSON.stringify(state.filters)}`,
  });

  // Reset navigation when modal closes
  useEffect(() => {
    if (!isOpen) {
      actions.reset();
    }
  }, [isOpen, actions]);

  // Don't render if not open
  if (!isOpen) return null;

  // Generate breadcrumbs
  const breadcrumbs = state.history.map((item, index) => {
    const levelConfig = config.levels.configs[item.level - 1];
    const titleValue = levelConfig?.title;
    return {
      level: item.level,
      label: typeof titleValue === 'function'
        ? titleValue(item.data)
        : titleValue || `Level ${item.level}`,
    };
  });

  // Get title and subtitle
  const titleValue = currentLevelConfig.title;
  const title = typeof titleValue === 'function'
    ? titleValue(data)
    : titleValue;

  const subtitleValue = currentLevelConfig.subtitle;
  const subtitle = subtitleValue
    ? typeof subtitleValue === 'function'
      ? subtitleValue(data)
      : subtitleValue
    : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <DrilldownHeader
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            onBack={state.currentLevel > 1 ? actions.goBack : undefined}
            breadcrumbs={breadcrumbs}
            onJumpToLevel={actions.jumpToLevel}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <DrilldownLoader />
            ) : error ? (
              <DrilldownError message={error.message} onRetry={refetch} />
            ) : (
              <DrilldownLevelRenderer
                config={config}
                level={state.currentLevel}
                data={data}
                onDrill={actions.drillForward}
                context={state.filters}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Renders the appropriate component for the current level
 */
interface DrilldownLevelRendererProps {
  config: DrilldownConfig;
  level: number;
  data: any;
  onDrill: (filters: Record<string, any>) => void;
  context: Record<string, any>;
}

function DrilldownLevelRenderer({
  config,
  level,
  data,
  onDrill,
  context,
}: DrilldownLevelRendererProps) {
  const levelConfig = config.levels.configs[level - 1];

  // If custom component is specified, render it
  if (levelConfig.customComponent) {
    const CustomComponent = levelConfig.customComponent;
    return (
      <CustomComponent
        data={data}
        config={levelConfig}
        onDrill={onDrill}
        context={context}
      />
    );
  }

  // Otherwise, render default level view based on visualization type
  const vizType = config.visualization[`level${level}` as keyof typeof config.visualization];

  // For now, show a placeholder - specific implementations will override with customComponent
  return (
    <div className="p-6">
      <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">
          Level {level} content ({vizType} visualization)
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Custom component should be provided in config
        </p>
        {data && (
          <pre className="mt-4 text-left text-xs bg-gray-800 p-4 rounded border border-gray-700 overflow-auto max-h-64 text-gray-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
