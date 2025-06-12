// /Users/montysharma/V11M2/src/components/StoryletBulkOperations.tsx
import React from 'react';
import { Button, Card } from './ui';
import { StoryletDeploymentStatus, Storylet } from '../types/storylet';

interface StoryletBulkOperationsProps {
  selectedStoryletIds: Set<string>;
  storylets: Storylet[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkStatusUpdate: () => void;
  onBulkDelete: () => void;
}

export const StoryletBulkOperations: React.FC<StoryletBulkOperationsProps> = ({
  selectedStoryletIds,
  storylets,
  onSelectAll,
  onDeselectAll,
  onBulkStatusUpdate,
  onBulkDelete
}) => {
  if (storylets.length === 0) return null;

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedStoryletIds.size} storylet{selectedStoryletIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <Button
              onClick={onSelectAll}
              variant="outline"
              size="sm"
              className="text-xs text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Select All ({storylets.length})
            </Button>
            <Button
              onClick={onDeselectAll}
              variant="outline"
              size="sm"
              className="text-xs text-gray-600 border-gray-300 hover:bg-gray-100"
              disabled={selectedStoryletIds.size === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={onBulkStatusUpdate}
            variant="primary"
            size="sm"
            className="text-xs"
            disabled={selectedStoryletIds.size === 0}
          >
            Update Status ({selectedStoryletIds.size})
          </Button>
          <Button
            onClick={onBulkDelete}
            variant="outline"
            size="sm"
            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
            disabled={selectedStoryletIds.size === 0}
          >
            Delete Selected ({selectedStoryletIds.size})
          </Button>
        </div>
      </div>
    </Card>
  );
};