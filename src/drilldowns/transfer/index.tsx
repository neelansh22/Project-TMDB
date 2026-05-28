/**
 * Transfer Drilldown - Entry Point
 * 
 * Main entry point that wires up the Transfer drilldown configuration
 * with level-specific components.
 */

'use client';

import { useState } from 'react';
import DrilldownModal from '@/components/drilldown/DrilldownModal';
import { DrilldownConfig } from '@/types/drilldown';
import { transferDrilldownConfig } from './config';
import TransferOverview from './levels/Level1Overview';
import TransferCallsList from './levels/Level2CallsList';
import ConversationViewer from '@/components/ConversationViewer';

/**
 * Enhanced config with custom components for each level
 */
export const transferDrilldownConfigWithComponents: DrilldownConfig = {
  ...transferDrilldownConfig,
  levels: {
    ...transferDrilldownConfig.levels,
    configs: [
      {
        ...transferDrilldownConfig.levels.configs[0],
        customComponent: TransferOverview,
      },
      {
        ...transferDrilldownConfig.levels.configs[1],
        customComponent: TransferCallsList,
      },
      {
        ...transferDrilldownConfig.levels.configs[2],
        customComponent: ConversationViewer,
      },
    ],
  },
};

/**
 * Transfer Drilldown Modal Component
 * 
 * Convenience wrapper for the Transfer drilldown
 */
interface TransferDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export default function TransferDrilldown({
  isOpen,
  onClose,
  initialData,
}: TransferDrilldownProps) {
  return (
    <DrilldownModal
      isOpen={isOpen}
      onClose={onClose}
      config={transferDrilldownConfigWithComponents}
      initialData={initialData}
    />
  );
}

/**
 * Hook to use Transfer drilldown
 */
export function useTransferDrilldown() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    open,
    close,
    DrilldownComponent: () => (
      <TransferDrilldown
        isOpen={isOpen}
        onClose={close}
      />
    ),
  };
}
