// /Users/montysharma/V11M2/src/components/minigames/PathPlanner/CostTracker.tsx
import React from 'react';
import { Card } from '../../ui';

interface CostTrackerProps {
  currentCost: number;
  budget?: number;
  moves: number;
}

const CostTracker: React.FC<CostTrackerProps> = ({
  currentCost,
  budget,
  moves
}) => {
  // Calculate progress and status
  const budgetProgress = budget ? (currentCost / budget) * 100 : 0;
  const isOverBudget = budget ? currentCost > budget : false;
  const isNearBudget = budget ? currentCost > budget * 0.8 : false;
  const averageCostPerMove = moves > 0 ? currentCost / moves : 0;

  // Get status color and message
  const getStatusInfo = () => {
    if (!budget) {
      return {
        color: 'blue',
        message: 'Track your path cost',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }

    if (isOverBudget) {
      return {
        color: 'red',
        message: 'Over budget!',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (isNearBudget) {
      return {
        color: 'amber',
        message: 'Approaching budget limit',
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      };
    }

    return {
      color: 'green',
      message: 'Within budget',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <span className="mr-2">💰</span>
        Cost Tracker
      </h3>

      {/* Current Cost Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {currentCost}
        </div>
        {budget && (
          <div className="text-sm text-gray-600">
            of {budget} budget
          </div>
        )}
      </div>

      {/* Budget Progress Bar */}
      {budget && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Budget Progress</span>
            <span>{budgetProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-red-500' :
                isNearBudget ? 'bg-amber-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          {isOverBudget && (
            <div className="text-xs text-red-600 mt-1">
              Exceeded by {currentCost - budget} units
            </div>
          )}
        </div>
      )}

      {/* Status Indicator */}
      <div className={`p-3 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border mb-4`}>
        <div className={`text-sm font-medium ${statusInfo.textColor}`}>
          {statusInfo.message}
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Cost:</span>
          <span className="font-medium text-gray-900">{currentCost}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Moves Made:</span>
          <span className="font-medium text-gray-900">{moves}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Avg. Cost/Move:</span>
          <span className="font-medium text-gray-900">
            {averageCostPerMove.toFixed(1)}
          </span>
        </div>

        {budget && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining Budget:</span>
              <span className={`font-medium ${
                budget - currentCost >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {budget - currentCost}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Cost Guide */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Cost Guide:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
            <span className="text-gray-600">Low (1-2)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span className="text-gray-600">Medium (3)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
            <span className="text-gray-600">High (4-5)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span className="text-gray-600">Very High (6+)</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Optimization Tips:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Lower cost paths are more efficient</li>
          <li>• Plan your route to minimize total cost</li>
          <li>• Stay within budget to succeed</li>
          <li>• Sometimes longer paths are cheaper</li>
        </ul>
      </div>
    </Card>
  );
};

export default CostTracker;