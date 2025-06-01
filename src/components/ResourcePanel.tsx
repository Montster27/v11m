// /Users/montysharma/V11M2/src/components/ResourcePanel.tsx

import React from 'react';
import { Card, ProgressBar } from './ui';
import { useAppStore } from '../store/useAppStore';

const ResourcePanel: React.FC = () => {
  const { resources } = useAppStore();

  const resourceConfig = [
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

  return (
    <div id="resources">
      <Card title="Resources" className="h-fit">
        <div className="space-y-4">
          {resourceConfig.map((config) => {
            const value = resources[config.key as keyof typeof resources];
            const displayValue = config.prefix ? `${config.prefix}${value.toFixed(1)}` : value.toFixed(1);
            
            return (
              <div key={config.key} className={`${config.critical ? 'animate-pulse' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className={`text-sm font-medium ${
                      config.critical ? 'text-red-700' : 
                      config.warning ? 'text-amber-700' : 
                      'text-gray-700'
                    }`}>
                      {config.label}:
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    config.critical ? 'text-red-900' : 
                    config.warning ? 'text-amber-900' : 
                    'text-gray-900'
                  }`}>
                    {displayValue}{!config.prefix ? `/${config.max}` : ''}
                  </span>
                </div>
                
                <div className={`${config.critical ? 'ring-2 ring-red-500 rounded' : ''}`}>
                  <ProgressBar
                    current={value}
                    max={config.max}
                    color={config.color}
                    showValues={false}
                  />
                </div>
                
                {/* Critical warnings */}
                {config.critical && (
                  <div className="text-xs text-red-600 font-medium mt-1 bg-red-50 px-2 py-1 rounded">
                    {config.key === 'energy' ? 'CRITICAL: Near exhaustion!' : 'CRITICAL: Extreme stress!'}
                  </div>
                )}
                
                {/* Warning messages */}
                {config.warning && !config.critical && (
                  <div className="text-xs text-amber-600 mt-1">
                    {config.key === 'energy' ? 'Low energy' : 
                     config.key === 'stress' ? 'High stress' :
                     config.key === 'money' ? 'Low funds' :
                     config.key === 'social' ? 'Socially isolated' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Overall Status */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            {resources.energy <= 0 || resources.stress >= 100 ? (
              <div className="text-red-600 font-bold text-sm animate-pulse">
                ⚠️ CRASH IMMINENT ⚠️
              </div>
            ) : resources.energy <= 20 || resources.stress >= 80 ? (
              <div className="text-amber-600 font-medium text-sm">
                ⚠️ Warning: Monitor resources carefully
              </div>
            ) : (
              <div className="text-green-600 text-sm">
                ✅ Resources stable
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResourcePanel;