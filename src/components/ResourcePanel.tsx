// /Users/montysharma/V11M2/src/components/ResourcePanel.tsx

import React from 'react';
import { Card, ProgressBar } from './ui';
import { useCoreGameStore } from '../stores/v2';

// Helper functions to reduce cognitive complexity
const getResourceConfig = (resources: any) => [
  { 
    key: 'energy', 
    label: 'Energy', 
    color: 'teal' as const,
    max: 100,
    icon: '⚡',
    critical: resources.energy <= 10,
    warning: resources.energy <= 20
  },
  { 
    key: 'stress', 
    label: 'Stress', 
    color: 'red' as const,
    max: 100,
    icon: '😰',
    critical: resources.stress >= 90,
    warning: resources.stress >= 80
  },
  { 
    key: 'money', 
    label: 'Money', 
    color: 'green' as const,
    max: 1000,
    prefix: '$',
    icon: '💰',
    critical: false,
    warning: resources.money < 50
  },
  { 
    key: 'knowledge', 
    label: 'Knowledge', 
    color: 'blue' as const,
    max: 1000,
    icon: '📚',
    critical: false,
    warning: false
  },
  { 
    key: 'social', 
    label: 'Social', 
    color: 'purple' as const,
    max: 1000,
    icon: '👥',
    critical: false,
    warning: resources.social <= 20
  }
];

const getStatusStyles = (critical: boolean, warning: boolean) => {
  if (critical) return 'text-red-700';
  if (warning) return 'text-amber-700';
  return 'text-gray-700';
};

const getValueStyles = (critical: boolean, warning: boolean) => {
  if (critical) return 'text-red-900';
  if (warning) return 'text-amber-900';
  return 'text-gray-900';
};

const getCriticalMessage = (key: string) => {
  return key === 'energy' ? 'CRITICAL: Near exhaustion!' : 'CRITICAL: Extreme stress!';
};

const getWarningMessage = (key: string) => {
  const messages: Record<string, string> = {
    energy: 'Low energy',
    stress: 'High stress',
    money: 'Low funds',
    social: 'Socially isolated'
  };
  return messages[key] || '';
};

const getOverallStatus = (resources: any) => {
  if (resources.energy <= 0 || resources.stress >= 100) {
    return {
      message: '⚠️ CRASH IMMINENT ⚠️',
      className: 'text-red-600 font-bold text-sm animate-pulse'
    };
  }
  if (resources.energy <= 20 || resources.stress >= 80) {
    return {
      message: '⚠️ Warning: Monitor resources carefully',
      className: 'text-amber-600 font-medium text-sm'
    };
  }
  return {
    message: '✅ Resources stable',
    className: 'text-green-600 text-sm'
  };
};

interface ResourceItemProps {
  config: any;
  value: number;
  displayValue: string;
}

const ResourceItem: React.FC<ResourceItemProps> = ({ config, value, displayValue }) => (
  <div className={config.critical ? 'animate-pulse' : ''}>
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{config.icon}</span>
        <span className={`text-sm font-medium ${getStatusStyles(config.critical, config.warning)}`}>
          {config.label}:
        </span>
      </div>
      <span className={`text-sm font-bold ${getValueStyles(config.critical, config.warning)}`}>
        {displayValue}{!config.prefix ? `/${config.max}` : ''}
      </span>
    </div>
    
    <div className={config.critical ? 'ring-2 ring-red-500 rounded' : ''}>
      <ProgressBar
        current={value}
        max={config.max}
        color={config.color}
        showValues={false}
      />
    </div>
    
    {config.critical && (
      <div className="text-xs text-red-600 font-medium mt-1 bg-red-50 px-2 py-1 rounded">
        {getCriticalMessage(config.key)}
      </div>
    )}
    
    {config.warning && !config.critical && (
      <div className="text-xs text-amber-600 mt-1">
        {getWarningMessage(config.key)}
      </div>
    )}
  </div>
);

const ResourcePanel: React.FC = () => {
  const resources = useCoreGameStore((state) => state.player.resources);
  
  // Ensure resources have default values if empty
  const normalizedResources = {
    energy: resources.energy ?? 75,
    stress: resources.stress ?? 25,
    money: resources.money ?? 20,
    knowledge: resources.knowledge ?? 100,
    social: resources.social ?? 200
  };
  
  const resourceConfig = getResourceConfig(normalizedResources);
  const overallStatus = getOverallStatus(normalizedResources);

  return (
    <div id="resources">
      <Card title="Resources" className="h-fit">
        <div className="space-y-4">
          {resourceConfig.map((config) => {
            const value = normalizedResources[config.key as keyof typeof normalizedResources];
            const displayValue = config.prefix ? `${config.prefix}${value.toFixed(1)}` : value.toFixed(1);
            
            return (
              <ResourceItem
                key={config.key}
                config={config}
                value={value}
                displayValue={displayValue}
              />
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className={overallStatus.className}>
              {overallStatus.message}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResourcePanel;
