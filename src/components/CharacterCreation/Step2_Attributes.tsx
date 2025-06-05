// /Users/montysharma/V11M2/src/components/CharacterCreation/Step2_Attributes.tsx
import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { Card, Button } from '../ui';

// Helper functions to improve readability
const getPointsUsedStyles = (remainingPoints: number) => {
  if (remainingPoints === 0) return 'bg-green-100 text-green-800';
  if (remainingPoints > 0) return 'bg-blue-100 text-blue-800';
  return 'bg-red-100 text-red-800';
};

const getRemainingPointsStyles = (remainingPoints: number) => {
  if (remainingPoints === 0) return 'bg-green-100 text-green-800';
  if (remainingPoints > 0) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const attributeList = [
  { key: 'intelligence', label: 'Intelligence', description: 'Problem-solving and learning ability' },
  { key: 'creativity', label: 'Creativity', description: 'Innovation and artistic thinking' },
  { key: 'memory', label: 'Memory', description: 'Information retention and recall' },
  { key: 'focus', label: 'Focus', description: 'Concentration and attention span' },
  { key: 'strength', label: 'Strength', description: 'Physical power and muscle' },
  { key: 'agility', label: 'Agility', description: 'Speed and nimbleness' },
  { key: 'endurance', label: 'Endurance', description: 'Stamina and persistence' },
  { key: 'dexterity', label: 'Dexterity', description: 'Fine motor skills and coordination' },
  { key: 'charisma', label: 'Charisma', description: 'Personal magnetism and leadership' },
  { key: 'empathy', label: 'Empathy', description: 'Understanding others\' emotions' },
  { key: 'communication', label: 'Communication', description: 'Expression and listening skills' },
  { key: 'emotionalStability', label: 'Emotional Stability', description: 'Mood regulation and composure' },
  { key: 'perseverance', label: 'Perseverance', description: 'Determination and grit' },
  { key: 'stressTolerance', label: 'Stress Tolerance', description: 'Handling pressure and anxiety' },
  { key: 'adaptability', label: 'Adaptability', description: 'Flexibility and openness to change' },
  { key: 'selfControl', label: 'Self Control', description: 'Impulse control and discipline' }
];

const Step2_Attributes: React.FC = () => {
  const { 
    currentCharacter, 
    updateCharacter, 
    nextStep, 
    prevStep, 
    isStepValid, 
    getTotalAttributePoints 
  } = useCharacterStore();
  
  const [attributes, setAttributes] = useState(currentCharacter?.attributes || {
    intelligence: 6, creativity: 6, memory: 6, focus: 6,
    strength: 6, agility: 6, endurance: 6, dexterity: 6,
    charisma: 6, empathy: 6, communication: 6,
    emotionalStability: 6, perseverance: 6, stressTolerance: 6,
    adaptability: 6, selfControl: 4
  });
  const totalPoints = getTotalAttributePoints();
  const remainingPoints = 100 - totalPoints;
  const canProceed = isStepValid(2);

  useEffect(() => {
    if (currentCharacter?.attributes) {
      setAttributes(currentCharacter.attributes);
    }
  }, [currentCharacter]);

  const handleAttributeChange = (key: string, value: number) => {
    const newAttributes = { ...attributes, [key]: value };
    setAttributes(newAttributes);
    updateCharacter({ attributes: newAttributes });
  };

  const resetToDefault = () => {
    const defaultAttributes = {
      intelligence: 6, creativity: 6, memory: 6, focus: 6,
      strength: 6, agility: 6, endurance: 6, dexterity: 6,
      charisma: 6, empathy: 6, communication: 6,
      emotionalStability: 6, perseverance: 6, stressTolerance: 6,
      adaptability: 6, selfControl: 4
    };
    setAttributes(defaultAttributes);
    updateCharacter({ attributes: defaultAttributes });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card title="Step 2: Attribute Allocation" className="text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribute Your Attribute Points</h2>
          <p className="text-gray-600 mb-4">
            Allocate exactly 100 points across 16 attributes. Each attribute can range from 1 to 10.
          </p>
          
          <div className="flex justify-center items-center space-x-6 mb-4">
            <div className={`px-4 py-2 rounded-lg font-medium ${getPointsUsedStyles(remainingPoints)}`}>
              Points Used: {totalPoints}/100
            </div>
            <div className={`px-4 py-2 rounded-lg font-medium ${getRemainingPointsStyles(remainingPoints)}`}>
              Remaining: {remainingPoints}
            </div>
          </div>

          <Button onClick={resetToDefault} variant="outline" size="sm">
            Reset to Defaults
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attributeList.map((attr) => {
            const currentValue = attributes[attr.key as keyof typeof attributes] || 1;
            
            const handleDecrease = () => {
              if (currentValue > 1) {
                handleAttributeChange(attr.key, currentValue - 1);
              }
            };
            
            const handleIncrease = () => {
              if (currentValue < 10) {
                handleAttributeChange(attr.key, currentValue + 1);
              }
            };
            
            return (
              <div key={attr.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    {attr.label}
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDecrease}
                      disabled={currentValue <= 1}
                      className="w-8 h-8 p-0 flex items-center justify-center"
                    >
                      −
                    </Button>
                    <div className="w-8 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {currentValue}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleIncrease}
                      disabled={currentValue >= 10}
                      className="w-8 h-8 p-0 flex items-center justify-center"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-200 ease-in-out"
                      style={{ width: `${(currentValue / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">{attr.description}</p>
              </div>
            );  
            })}
        </div>
      </Card>

      <Card className="bg-gray-50">
        <div className="flex justify-between items-center">
          <Button onClick={prevStep} variant="outline">
            Back: Name
          </Button>
          
          <div className="text-center">
            {!canProceed && (
              <p className="text-sm text-red-600 mb-2">
                Please allocate exactly 100 points to continue
              </p>
            )}
          </div>
          
          <Button
            onClick={nextStep}
            disabled={!canProceed}
            variant="primary"
          >
            Next: Review
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Step2_Attributes;