// /Users/montysharma/V11M2/src/components/IntegratedCharacterDashboard.tsx
// New character dashboard for the integrated 7-domain system

import React, { useState } from 'react';
import { useIntegratedCharacterStore } from '../store/integratedCharacterStore';
import { 
  DomainKey, 
  DOMAIN_DISPLAY_INFO, 
  DEVELOPMENT_STAGES 
} from '../types/integratedCharacter';
import { Card, Button, ProgressBar } from './ui';
import { getStageProgress, getXPToNextStage } from '../utils/developmentCalculations';

interface DomainCardProps {
  domainKey: DomainKey;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const DomainCard: React.FC<DomainCardProps> = ({ domainKey, isExpanded, onToggleExpand }) => {
  const { currentCharacter } = useIntegratedCharacterStore();
  
  if (!currentCharacter) return null;
  
  const domain = currentCharacter[domainKey];
  const displayInfo = DOMAIN_DISPLAY_INFO[domainKey];
  const stages = DEVELOPMENT_STAGES[domainKey];
  const currentStageInfo = stages[domain.developmentStage - 1];
  const nextStageInfo = stages[domain.developmentStage];
  
  const stageProgress = getStageProgress(domain, domainKey);
  const xpToNext = getXPToNextStage(domain, domainKey);
  
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 text-gray-800';
  };
  
  const getProgressBarColor = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      indigo: 'bg-indigo-500',
      yellow: 'bg-yellow-500'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500';
  };
  
  return (
    <Card className={`p-4 border-2 transition-all duration-200 ${getColorClasses(displayInfo.color)}`}>
      {/* Header */}
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{displayInfo.icon}</span>
          <div>
            <h3 className="font-bold text-lg">{displayInfo.name}</h3>
            <p className="text-sm opacity-75">{displayInfo.description}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-2">
            {/* Level Display */}
            <div className="text-right">
              <div className="text-2xl font-bold">{domain.level}</div>
              <div className="text-xs opacity-75">Level</div>
            </div>
            
            {/* Stage Display */}
            <div className="text-right">
              <div className="text-lg font-semibold">Stage {domain.developmentStage}</div>
              <div className="text-xs opacity-75">{currentStageInfo.name}</div>
            </div>
            
            {/* Expand/Collapse Icon */}
            <div className="text-xl">
              {isExpanded ? '▼' : '▶'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress to Stage {domain.developmentStage + 1}</span>
          <span>{Math.round(stageProgress)}%</span>
        </div>
        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(displayInfo.color)}`}
            style={{ width: `${stageProgress}%` }}
          />
        </div>
        {nextStageInfo && (
          <div className="text-xs mt-1 opacity-75">
            {xpToNext} XP to "{nextStageInfo.name}"
          </div>
        )}
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-white border-opacity-30 pt-4">
          {/* Components */}
          <div>
            <h4 className="font-semibold mb-2">Components</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(domain.components).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize text-sm">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-white bg-opacity-50 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${getProgressBarColor(displayInfo.color)}`}
                        style={{ width: `${Math.min(100, (value || 0))}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-8 text-right">{Math.round(value || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stage Information */}
          <div>
            <h4 className="font-semibold mb-2">Current Stage: {currentStageInfo.name}</h4>
            <p className="text-sm mb-2">{currentStageInfo.description}</p>
            
            {/* Benefits */}
            {currentStageInfo.benefits.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-semibold mb-1">Benefits:</div>
                <ul className="text-xs space-y-1">
                  {currentStageInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-green-600">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Unlocks */}
            {currentStageInfo.unlocks.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1">Unlocked:</div>
                <ul className="text-xs space-y-1">
                  {currentStageInfo.unlocks.map((unlock, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-blue-600">🔓</span>
                      <span className="capitalize">{unlock.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Next Stage Preview */}
          {nextStageInfo && (
            <div className="bg-white bg-opacity-30 rounded-lg p-3">
              <h4 className="font-semibold mb-1">Next: {nextStageInfo.name}</h4>
              <p className="text-sm mb-2">{nextStageInfo.description}</p>
              <div className="text-xs">
                <span className="font-semibold">Requires:</span> {nextStageInfo.requirements} total XP
              </div>
            </div>
          )}
          
          {/* Development Stats */}
          <div className="bg-white bg-opacity-30 rounded-lg p-3">
            <h4 className="font-semibold mb-2">Development Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold">Experience Points</div>
                <div>{domain.experiencePoints}</div>
              </div>
              <div>
                <div className="font-semibold">Confidence</div>
                <div>{domain.confidence}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const IntegratedCharacterDashboard: React.FC = () => {
  const { 
    currentCharacter, 
    getDevelopmentSummary, 
    getDevelopmentSuggestion 
  } = useIntegratedCharacterStore();
  
  const [expandedDomains, setExpandedDomains] = useState<Set<DomainKey>>(new Set());
  
  if (!currentCharacter) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">No Character Selected</h2>
        <p className="text-gray-500">Create or select a character to view their development dashboard.</p>
      </div>
    );
  }
  
  const developmentSummary = getDevelopmentSummary();
  const suggestion = getDevelopmentSuggestion();
  
  const toggleDomainExpansion = (domainKey: DomainKey) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domainKey)) {
      newExpanded.delete(domainKey);
    } else {
      newExpanded.add(domainKey);
    }
    setExpandedDomains(newExpanded);
  };
  
  const domains: DomainKey[] = [
    'intellectualCompetence',
    'physicalCompetence', 
    'emotionalIntelligence',
    'socialCompetence',
    'personalAutonomy',
    'identityClarity',
    'lifePurpose'
  ];
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentCharacter.name}'s Development Journey
        </h1>
        <p className="text-gray-600">
          Integrated Character System - Seven Domains of Growth
        </p>
      </div>
      
      {/* Overall Summary */}
      {developmentSummary && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-bold mb-4">Development Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{developmentSummary.score}</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{developmentSummary.averageStage}</div>
              <div className="text-sm text-gray-600">Average Stage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {DOMAIN_DISPLAY_INFO[developmentSummary.strongestDomain.domain].icon} Stage {developmentSummary.strongestDomain.stage}
              </div>
              <div className="text-sm text-gray-600">Strongest Domain</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {DOMAIN_DISPLAY_INFO[developmentSummary.weakestDomain.domain].icon} Stage {developmentSummary.weakestDomain.stage}
              </div>
              <div className="text-sm text-gray-600">Growth Opportunity</div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Development Suggestion */}
      {suggestion && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-2">💡 Development Suggestion</h3>
          <p className="text-yellow-700 mb-2">{suggestion.reasoning}</p>
          <div className="flex space-x-4 text-sm">
            <div>
              <span className="font-semibold">Primary Focus:</span> {DOMAIN_DISPLAY_INFO[suggestion.primaryFocus].name}
            </div>
            <div>
              <span className="font-semibold">Secondary:</span> {DOMAIN_DISPLAY_INFO[suggestion.secondaryFocus].name}
            </div>
          </div>
        </Card>
      )}
      
      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={() => setExpandedDomains(new Set(domains))}
          variant="outline"
        >
          Expand All
        </Button>
        <Button 
          onClick={() => setExpandedDomains(new Set())}
          variant="outline"
        >
          Collapse All
        </Button>
      </div>
      
      {/* Domain Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {domains.map(domainKey => (
          <DomainCard
            key={domainKey}
            domainKey={domainKey}
            isExpanded={expandedDomains.has(domainKey)}
            onToggleExpand={() => toggleDomainExpansion(domainKey)}
          />
        ))}
      </div>
      
      {/* Development History (if expanded) */}
      {currentCharacter.developmentHistory.length > 1 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Recent Development Events</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentCharacter.developmentHistory
              .slice(-10)
              .reverse()
              .map(event => (
                <div key={event.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium">{event.description}</div>
                    <div className="text-sm text-gray-500">
                      {event.domain} • {event.eventType.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-green-600 font-medium">+{event.experienceGained} XP</div>
                    <div className="text-gray-500">
                      {event.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default IntegratedCharacterDashboard;