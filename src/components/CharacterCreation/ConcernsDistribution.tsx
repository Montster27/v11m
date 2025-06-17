import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';

export interface CharacterConcerns {
  academics: number;
  socialFitting: number;
  financial: number;
  isolation: number;
  genderIssues: number;
  raceIssues: number;
  classIssues: number;
}

interface ConcernItem {
  key: keyof CharacterConcerns;
  label: string;
  description: string;
  icon: string;
  contextInfo: string;
}

interface ConcernsDistributionProps {
  onComplete: (concerns: CharacterConcerns) => void;
  onBack?: () => void;
}

const ConcernsDistribution: React.FC<ConcernsDistributionProps> = ({
  onComplete,
  onBack
}) => {
  const [concerns, setConcerns] = useState<CharacterConcerns>({
    academics: 0,
    socialFitting: 0,
    financial: 0,
    isolation: 0,
    genderIssues: 0,
    raceIssues: 0,
    classIssues: 0
  });

  const [totalPoints, setTotalPoints] = useState(0);
  const maxPoints = 50;

  const concernItems: ConcernItem[] = [
    {
      key: 'academics',
      label: 'Academic Performance',
      description: 'Concerns about grades, studying, and academic success',
      icon: '📚',
      contextInfo: 'College is competitive, and academic performance affects future opportunities'
    },
    {
      key: 'socialFitting',
      label: 'Social Fitting In',
      description: 'Worries about making friends, being accepted, and social status',
      icon: '👥',
      contextInfo: 'Social connections are crucial for college life and networking'
    },
    {
      key: 'financial',
      label: 'Financial Pressures',
      description: 'Money concerns including tuition, living expenses, and debt',
      icon: '💰',
      contextInfo: 'College costs are rising, and many students work while studying'
    },
    {
      key: 'isolation',
      label: 'Being Isolated',
      description: 'Fear of loneliness and not finding your place or community',
      icon: '🏝️',
      contextInfo: 'Large campuses can feel impersonal, and it\'s easy to feel lost'
    },
    {
      key: 'genderIssues',
      label: 'Gender Issues',
      description: 'Challenges related to gender expectations and equality (1980s context)',
      icon: '⚖️',
      contextInfo: 'The 1980s saw evolving gender roles, workplace equality debates, and changing expectations'
    },
    {
      key: 'raceIssues',
      label: 'Racial Issues',
      description: 'Experiences with racial dynamics and representation (1980s context)',
      icon: '🤝',
      contextInfo: 'Civil rights progress continued, but institutional and social challenges remained significant'
    },
    {
      key: 'classIssues',
      label: 'Social Class Issues',
      description: 'Economic background differences and class-based social dynamics',
      icon: '🏛️',
      contextInfo: 'Economic disparities were stark, affecting everything from opportunities to social acceptance'
    }
  ];

  useEffect(() => {
    const total = Object.values(concerns).reduce((sum, value) => sum + value, 0);
    setTotalPoints(total);
  }, [concerns]);

  const updateConcern = (key: keyof CharacterConcerns, value: number) => {
    const newValue = Math.max(0, Math.min(50, value));
    const currentTotal = totalPoints - concerns[key];
    
    // Don't allow exceeding max points
    if (currentTotal + newValue <= maxPoints) {
      setConcerns(prev => ({
        ...prev,
        [key]: newValue
      }));
    }
  };

  const getSliderColor = (value: number) => {
    if (value === 0) return 'bg-gray-200';
    if (value <= 10) return 'bg-green-400';
    if (value <= 20) return 'bg-yellow-400';
    if (value <= 30) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getTextColor = (value: number) => {
    if (value === 0) return 'text-gray-500';
    if (value <= 10) return 'text-green-700';
    if (value <= 20) return 'text-yellow-700';
    if (value <= 30) return 'text-orange-700';
    return 'text-red-700';
  };

  const resetDistribution = () => {
    setConcerns({
      academics: 0,
      socialFitting: 0,
      financial: 0,
      isolation: 0,
      genderIssues: 0,
      raceIssues: 0,
      classIssues: 0
    });
  };

  const distributeEvenly = () => {
    const evenDistribution = Math.floor(maxPoints / concernItems.length);
    const remainder = maxPoints % concernItems.length;
    
    const newConcerns = { ...concerns };
    concernItems.forEach((item, index) => {
      newConcerns[item.key] = evenDistribution + (index < remainder ? 1 : 0);
    });
    
    setConcerns(newConcerns);
  };

  const isComplete = totalPoints === maxPoints;
  const remainingPoints = maxPoints - totalPoints;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Character Concerns</h2>
          <p className="text-gray-600 text-lg">
            Before creating your character, help us understand what matters most to them
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Setting:</strong> It's the 1980s, and you're entering college. Different people have different concerns and priorities.
              Distribute <strong>{maxPoints} points</strong> across these areas to reflect what your character cares about most.
            </p>
          </div>
        </div>

        {/* Points Counter */}
        <div className="text-center mb-8">
          <div className={`text-4xl font-bold mb-2 ${
            remainingPoints === 0 ? 'text-green-600' : 
            remainingPoints < 0 ? 'text-red-600' : 'text-blue-600'
          }`}>
            {remainingPoints} points remaining
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                totalPoints === maxPoints ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(totalPoints / maxPoints) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Concerns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {concernItems.map((item) => (
            <Card key={item.key} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className={`text-xl font-bold ${getTextColor(concerns[item.key])}`}>
                    {concerns[item.key]}
                  </div>
                </div>

                {/* Context Info */}
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 border-l-3 border-gray-300">
                  <strong>1980s Context:</strong> {item.contextInfo}
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={concerns[item.key]}
                    onChange={(e) => updateConcern(item.key, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${getSliderColor(concerns[item.key])} 0%, ${getSliderColor(concerns[item.key])} ${(concerns[item.key] / 50) * 100}%, #e5e7eb ${(concerns[item.key] / 50) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  
                  {/* Quick buttons */}
                  <div className="flex justify-between text-xs">
                    <button
                      onClick={() => updateConcern(item.key, 0)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                    >
                      None (0)
                    </button>
                    <button
                      onClick={() => updateConcern(item.key, 10)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                    >
                      Low (10)
                    </button>
                    <button
                      onClick={() => updateConcern(item.key, 20)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                    >
                      High (20)
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Helper Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button onClick={resetDistribution} variant="outline">
            🔄 Reset All
          </Button>
          <Button onClick={distributeEvenly} variant="outline">
            ⚖️ Distribute Evenly
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              ← Back
            </Button>
          )}
          
          <div className="flex-1"></div>
          
          <Button 
            onClick={() => onComplete(concerns)} 
            variant="primary"
            disabled={!isComplete}
            className={!isComplete ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isComplete ? 'Continue to Character Creation →' : `Distribute ${remainingPoints} more points`}
          </Button>
        </div>

        {/* Summary */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">✅ Character Concerns Profile</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {concernItems.map((item) => (
                <div key={item.key} className="flex justify-between">
                  <span className="text-green-700">{item.icon} {item.label.split(' ')[0]}:</span>
                  <span className="font-semibold text-green-800">{concerns[item.key]}</span>
                </div>
              ))}
            </div>
            <p className="text-green-700 text-xs mt-2">
              These values will influence storylet availability and character development throughout the game.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConcernsDistribution;