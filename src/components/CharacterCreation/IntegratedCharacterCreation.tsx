// /Users/montysharma/V11M2/src/components/CharacterCreation/IntegratedCharacterCreation.tsx
// Character creation flow for the new integrated character system (V2)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntegratedCharacterStore } from '../../store/integratedCharacterStore';
import { useAppStore } from '../../store/useAppStore';
import { useCharacterConcernsStore } from '../../store/useCharacterConcernsStore';
import { Button, Card, Slider } from '../ui';
import { IntegratedCharacter, DomainKey } from '../../types/integratedCharacter';
import IntegratedRadarChart from './IntegratedRadarChart';

interface IntegratedCharacterCreationProps {
  onBack?: () => void;
}

interface DomainAdjustment {
  intellectualCompetence: number;
  physicalCompetence: number;
  emotionalIntelligence: number;
  socialCompetence: number;
  personalAutonomy: number;
  identityClarity: number;
  lifePurpose: number;
}

const DOMAIN_DESCRIPTIONS = {
  intellectualCompetence: {
    title: "Intellectual Competence",
    description: "Your ability to think critically, solve problems, and learn new concepts",
    components: ["reasoning", "innovation", "retention"]
  },
  physicalCompetence: {
    title: "Physical Competence", 
    description: "Your physical abilities, coordination, and discipline",
    components: ["power", "coordination", "discipline"]
  },
  emotionalIntelligence: {
    title: "Emotional Intelligence",
    description: "Your ability to understand and manage emotions",
    components: ["awareness", "regulation", "resilience"]
  },
  socialCompetence: {
    title: "Social Competence",
    description: "Your ability to build relationships and communicate effectively",
    components: ["connection", "communication", "relationships"]
  },
  personalAutonomy: {
    title: "Personal Autonomy",
    description: "Your independence and sense of self-direction",
    components: ["independence", "interdependence", "responsibility"]
  },
  identityClarity: {
    title: "Identity Clarity",
    description: "Your understanding of who you are and what you value",
    components: ["selfAwareness", "values", "authenticity"]
  },
  lifePurpose: {
    title: "Life Purpose",
    description: "Your sense of meaning and direction in life",
    components: ["direction", "meaning", "integrity"]
  }
};

const IntegratedCharacterCreation: React.FC<IntegratedCharacterCreationProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { createCharacter, updateCharacter } = useIntegratedCharacterStore();
  const { setActiveCharacter } = useAppStore();
  
  console.log('🎭 IntegratedCharacterCreation component mounted');
  
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState('');
  const [domainAdjustments, setDomainAdjustments] = useState<DomainAdjustment>({
    intellectualCompetence: 0,
    physicalCompetence: 0,
    emotionalIntelligence: 0,
    socialCompetence: 0,
    personalAutonomy: 0,
    identityClarity: 0,
    lifePurpose: 0
  });

  const [tempCharacter, setTempCharacter] = useState<IntegratedCharacter | null>(null);

  // Calculate total adjustment points used
  const totalAdjustments = Object.values(domainAdjustments).reduce((sum, val) => sum + Math.abs(val), 0);
  const remainingPoints = Math.max(0, 40 - totalAdjustments); // Allow 40 points of adjustment

  const handleNameSubmit = () => {
    if (characterName.trim()) {
      // DON'T create character yet - just move to next step
      setStep(2);
    }
  };

  const handleDomainAdjustment = (domain: DomainKey, adjustment: number) => {
    const newAdjustments = { ...domainAdjustments, [domain]: adjustment };
    
    // Check if total adjustments exceed limit
    const newTotal = Object.values(newAdjustments).reduce((sum, val) => sum + Math.abs(val), 0);
    if (newTotal <= 40) {
      setDomainAdjustments(newAdjustments);
    }
  };

  const handleFinalize = () => {
    if (!characterName.trim()) return;

    console.log('🔄 Creating new character with full reset...');
    
    // Create character - this will trigger the full reset in the store
    const newCharacter = createCharacter(characterName.trim());
    
    // Apply domain adjustments to the character
    const updatedCharacter: IntegratedCharacter = {
      ...newCharacter,
      intellectualCompetence: {
        ...newCharacter.intellectualCompetence,
        level: Math.max(5, Math.min(100, newCharacter.intellectualCompetence.level + domainAdjustments.intellectualCompetence))
      },
      physicalCompetence: {
        ...newCharacter.physicalCompetence,
        level: Math.max(5, Math.min(100, newCharacter.physicalCompetence.level + domainAdjustments.physicalCompetence))
      },
      emotionalIntelligence: {
        ...newCharacter.emotionalIntelligence,
        level: Math.max(5, Math.min(100, newCharacter.emotionalIntelligence.level + domainAdjustments.emotionalIntelligence))
      },
      socialCompetence: {
        ...newCharacter.socialCompetence,
        level: Math.max(5, Math.min(100, newCharacter.socialCompetence.level + domainAdjustments.socialCompetence))
      },
      personalAutonomy: {
        ...newCharacter.personalAutonomy,
        level: Math.max(5, Math.min(100, newCharacter.personalAutonomy.level + domainAdjustments.personalAutonomy))
      },
      identityClarity: {
        ...newCharacter.identityClarity,
        level: Math.max(5, Math.min(100, newCharacter.identityClarity.level + domainAdjustments.identityClarity))
      },
      lifePurpose: {
        ...newCharacter.lifePurpose,
        level: Math.max(5, Math.min(100, newCharacter.lifePurpose.level + domainAdjustments.lifePurpose))
      }
    };

    updateCharacter(updatedCharacter);
    setActiveCharacter(updatedCharacter);
    
    // Navigate to planner after character creation
    setTimeout(() => {
      console.log('✅ Character creation complete - navigating to planner');
      navigate('/planner');
    }, 300); // Wait for all the store resets to complete
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Create Your Character</h1>
              <p className="text-gray-600">
                Start your journey of personal development and growth
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 mb-2">
                  Character Name
                </label>
                <input
                  id="characterName"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter your character's name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && characterName.trim() && handleNameSubmit()}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">About the Integrated Character System</h3>
                <p className="text-sm text-blue-800">
                  Your character develops across 7 key domains based on psychological research. 
                  Each domain grows through experience and affects your abilities in the simulation.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleNameSubmit}
                  disabled={!characterName.trim()}
                  className="w-full"
                  variant="primary"
                >
                  Continue to Character Customization
                </Button>
                
                {onBack && (
                  <Button
                    onClick={onBack}
                    className="w-full"
                    variant="outline"
                  >
                    ← Back to Character Concerns
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Customize {characterName}</h1>
            <p className="text-gray-600">
              Adjust your starting development levels across the 7 domains
            </p>
            <div className="text-sm text-blue-600">
              Adjustment Points Remaining: {remainingPoints}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Real-time Character Preview */}
            <Card className="p-4 xl:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Character Preview
              </h3>
              <div className="flex justify-center">
                <IntegratedRadarChart 
                  character={tempCharacter ? {
                    ...tempCharacter,
                    intellectualCompetence: {
                      ...tempCharacter.intellectualCompetence,
                      level: Math.max(5, Math.min(100, tempCharacter.intellectualCompetence.level + domainAdjustments.intellectualCompetence))
                    },
                    physicalCompetence: {
                      ...tempCharacter.physicalCompetence,
                      level: Math.max(5, Math.min(100, tempCharacter.physicalCompetence.level + domainAdjustments.physicalCompetence))
                    },
                    emotionalIntelligence: {
                      ...tempCharacter.emotionalIntelligence,
                      level: Math.max(5, Math.min(100, tempCharacter.emotionalIntelligence.level + domainAdjustments.emotionalIntelligence))
                    },
                    socialCompetence: {
                      ...tempCharacter.socialCompetence,
                      level: Math.max(5, Math.min(100, tempCharacter.socialCompetence.level + domainAdjustments.socialCompetence))
                    },
                    personalAutonomy: {
                      ...tempCharacter.personalAutonomy,
                      level: Math.max(5, Math.min(100, tempCharacter.personalAutonomy.level + domainAdjustments.personalAutonomy))
                    },
                    identityClarity: {
                      ...tempCharacter.identityClarity,
                      level: Math.max(5, Math.min(100, tempCharacter.identityClarity.level + domainAdjustments.identityClarity))
                    },
                    lifePurpose: {
                      ...tempCharacter.lifePurpose,
                      level: Math.max(5, Math.min(100, tempCharacter.lifePurpose.level + domainAdjustments.lifePurpose))
                    }
                  } : tempCharacter!} 
                  size={280} 
                  showLegend={false}
                />
              </div>
            </Card>
            
            {/* Domain Adjustment Controls */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DOMAIN_DESCRIPTIONS).map(([domainKey, info]) => {
                const baseLevel = tempCharacter?.[domainKey as DomainKey]?.level || 25;
                const adjustment = domainAdjustments[domainKey as DomainKey];
                const finalLevel = Math.max(5, Math.min(100, baseLevel + adjustment));
                const domainColor = domainInfo.find(d => d.key === domainKey)?.color || '#3b82f6';
                
                return (
                  <Card key={domainKey} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: domainColor }}
                          />
                          <h3 className="text-base font-semibold text-gray-900">{info.title}</h3>
                        </div>
                        <p className="text-xs text-gray-600">{info.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base: {baseLevel}</span>
                          <span className="font-semibold text-gray-900">Final: {finalLevel}</span>
                        </div>
                        <Slider
                          value={adjustment}
                          onChange={(value) => handleDomainAdjustment(domainKey as DomainKey, value)}
                          min={-20}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-center">
                          <span className={`font-medium ${adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {adjustment > 0 ? '+' : ''}{adjustment}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Components: {info.components.join(', ')}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
            >
              ← Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              variant="primary"
            >
              Review Character →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3 && tempCharacter) {
    const finalCharacter = {
      ...tempCharacter,
      intellectualCompetence: {
        ...tempCharacter.intellectualCompetence,
        level: Math.max(5, Math.min(100, tempCharacter.intellectualCompetence.level + domainAdjustments.intellectualCompetence))
      },
      physicalCompetence: {
        ...tempCharacter.physicalCompetence,
        level: Math.max(5, Math.min(100, tempCharacter.physicalCompetence.level + domainAdjustments.physicalCompetence))
      },
      emotionalIntelligence: {
        ...tempCharacter.emotionalIntelligence,
        level: Math.max(5, Math.min(100, tempCharacter.emotionalIntelligence.level + domainAdjustments.emotionalIntelligence))
      },
      socialCompetence: {
        ...tempCharacter.socialCompetence,
        level: Math.max(5, Math.min(100, tempCharacter.socialCompetence.level + domainAdjustments.socialCompetence))
      },
      personalAutonomy: {
        ...tempCharacter.personalAutonomy,
        level: Math.max(5, Math.min(100, tempCharacter.personalAutonomy.level + domainAdjustments.personalAutonomy))
      },
      identityClarity: {
        ...tempCharacter.identityClarity,
        level: Math.max(5, Math.min(100, tempCharacter.identityClarity.level + domainAdjustments.identityClarity))
      },
      lifePurpose: {
        ...tempCharacter.lifePurpose,
        level: Math.max(5, Math.min(100, tempCharacter.lifePurpose.level + domainAdjustments.lifePurpose))
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Review {characterName}</h1>
            <p className="text-gray-600">
              Final character stats before starting your journey
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Radar Chart */}
            <Card className="p-4 xl:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Character Development Profile
              </h3>
              <div className="flex justify-center">
                <IntegratedRadarChart character={finalCharacter} size={450} showLegend={false} />
              </div>
            </Card>

            {/* Domain Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Domain Summary</h3>
              <div className="space-y-4">
                {Object.entries(DOMAIN_DESCRIPTIONS).map(([domainKey, info]) => {
                  const domain = finalCharacter[domainKey as DomainKey];
                  const domainColor = domainInfo.find(d => d.key === domainKey)?.color || '#3b82f6';
                  return (
                    <div key={domainKey} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: domainColor }}
                          />
                          <span className="text-sm font-semibold text-gray-800">{info.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">{domain.level}</span>
                          <span className="text-xs text-gray-500">Stage {domain.developmentStage}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ 
                            width: `${domain.level}%`,
                            backgroundColor: domainColor,
                            boxShadow: `0 0 8px ${domainColor}40`
                          }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {domain.confidence}% confidence
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>
          
          {/* Character Concerns Summary - Full Width */}
          <div className="grid grid-cols-1">
            <ConcernsSummaryCard />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Begin!</h3>
            <p className="text-green-800">
              Your character will grow and develop through experiences in the life simulation. 
              Each choice you make will contribute to your personal development across these domains.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
            >
              ← Back to Customize
            </Button>
            <Button
              onClick={handleFinalize}
              variant="primary"
              size="lg"
            >
              Start Your Journey! 🚀
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Import domain info for color consistency
const domainInfo = [
  { key: 'intellectualCompetence', label: 'Intellectual', color: '#3b82f6' },
  { key: 'physicalCompetence', label: 'Physical', color: '#10b981' },
  { key: 'emotionalIntelligence', label: 'Emotional', color: '#f59e0b' },
  { key: 'socialCompetence', label: 'Social', color: '#ef4444' },
  { key: 'personalAutonomy', label: 'Autonomy', color: '#8b5cf6' },
  { key: 'identityClarity', label: 'Identity', color: '#06b6d4' },
  { key: 'lifePurpose', label: 'Purpose', color: '#84cc16' }
];

// Component for displaying character concerns summary
const ConcernsSummaryCard: React.FC = () => {
  const { concerns, getTopConcerns, getConcernsProfile, getTotalConcernPoints, hasActiveConcerns } = useCharacterConcernsStore();

  if (!hasActiveConcerns()) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Character Concerns</h3>
        <p className="text-gray-500 text-sm">No specific concerns defined for this character.</p>
      </Card>
    );
  }

  const topConcerns = getTopConcerns(3);
  const profile = getConcernsProfile();
  const totalPoints = getTotalConcernPoints();

  const getConcernColor = (value: number) => {
    if (value === 0) return 'text-gray-400';
    if (value <= 10) return 'text-green-600';
    if (value <= 20) return 'text-yellow-600';
    if (value <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConcernBgColor = (value: number) => {
    if (value === 0) return 'bg-gray-200';
    if (value <= 10) return 'bg-green-200';
    if (value <= 20) return 'bg-yellow-200';
    if (value <= 30) return 'bg-orange-200';
    return 'bg-red-200';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Character Concerns</h3>
      
      <div className="space-y-4">
        {/* Top Concerns */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Primary Concerns</h4>
          <div className="space-y-2">
            {topConcerns.map(({ concern, value, label }) => (
              <div key={concern} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getConcernBgColor(value).replace('bg-', 'bg-opacity-60 bg-')}`}
                      style={{ width: `${(value / 50) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold w-6 ${getConcernColor(value)}`}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Character Profile */}
        {profile.primary && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Character Profile</h4>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Primary Focus:</span> {profile.primary.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
              {profile.secondary && (
                <p><span className="font-medium">Secondary:</span> {profile.secondary.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
              )}
            </div>
          </div>
        )}

        {/* Total Points Distributed */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Points Allocated:</span>
            <span className="font-semibold text-gray-900">{totalPoints}/50</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IntegratedCharacterCreation;