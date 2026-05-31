/**
 * Error Drilldown - Entry Point
 * 
 * Main entry point that wires up the Error drilldown configuration
 * with level-specific components.
 */

'use client';

import { useState } from 'react';
import DrilldownModal from '@/components/drilldown/DrilldownModal';
import { DrilldownConfig } from '@/types/drilldown';
import { errorDrilldownConfig } from './config';
import ErrorOverview from './levels/Level1Overview';
import ErrorCallsList from './levels/Level2CallsList';
import Level3ConversationWrapper from './levels/Level3ConversationWrapper';

/**
 * Enhanced config with custom components for each level
 */
export const errorDrilldownConfigWithComponents: DrilldownConfig = {
  ...errorDrilldownConfig,
  levels: {
    ...errorDrilldownConfig.levels,
    configs: [
      {
        ...errorDrilldownConfig.levels.configs[0],
        customComponent: ErrorOverview,
      },
      {
        ...errorDrilldownConfig.levels.configs[1],
        customComponent: ErrorCallsList,
      },
      {
        ...errorDrilldownConfig.levels.configs[2],
        customComponent: Level3ConversationWrapper,
      },
    ],
  },
};

/**
 * Error Drilldown Modal Component
 * 
 * Convenience wrapper for the Error drilldown
 */
interface ErrorDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export default function ErrorDrilldown({
  isOpen,
  onClose,
  initialData,
}: ErrorDrilldownProps) {
  return (
    <DrilldownModal
      isOpen={isOpen}
      onClose={onClose}
      config={errorDrilldownConfigWithComponents}
      initialData={initialData}
    />
  );
}

/**
 * Hook to use Error drilldown
 */
export function useErrorDrilldown() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    open,
    close,
    DrilldownComponent: () => (
      <ErrorDrilldown
        isOpen={isOpen}
        onClose={close}
      />
    ),
  };
}
