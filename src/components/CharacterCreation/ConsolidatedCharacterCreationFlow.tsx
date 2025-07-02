// /Users/montysharma/V11M2/src/components/CharacterCreation/ConsolidatedCharacterCreationFlow.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoreGameStore, useNarrativeStore } from '../../stores/v2';
import { createCharacterAsSaveSlot, validateCharacterCreationData } from '../../utils/characterFlowIntegration';
import { Button, Card, Slider } from '../ui';

interface DomainAdjustments {
  intellectualCompetence: number;
  physicalCompetence: number;
  emotionalIntelligence: number;
  socialCompetence: number;
  personalAutonomy: number;
  identityClarity: number;
  lifePurpose: number;
}

interface AttributeValues {
  intelligence: number;
  creativity: number;
  charisma: number;
  strength: number;
  focus: number;
  empathy: number;
}

const ConsolidatedCharacterCreationFlow: React.FC = () => {
  const navigate = useNavigate();
  const coreStore = useCoreGameStore();
  
  // Check if we're editing existing character
  const isEditing = coreStore.character.name && coreStore.character.name.trim() !== '';
  
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState('');
  // Point allocation system - start with minimum values and give points to allocate
  const TOTAL_ATTRIBUTE_POINTS = 100;
  const MIN_ATTRIBUTE_VALUE = 10;
  const MAX_ATTRIBUTE_VALUE = 80;
  
  const [attributes, setAttributes] = useState<AttributeValues>({
    intelligence: MIN_ATTRIBUTE_VALUE,
    creativity: MIN_ATTRIBUTE_VALUE,
    charisma: MIN_ATTRIBUTE_VALUE,
    strength: MIN_ATTRIBUTE_VALUE,
    focus: MIN_ATTRIBUTE_VALUE,
    empathy: MIN_ATTRIBUTE_VALUE
  });
  
  const getTotalAttributePoints = () => {
    return Object.values(attributes).reduce((sum, value) => sum + value, 0);
  };
  
  const getAvailableAttributePoints = () => {
    return TOTAL_ATTRIBUTE_POINTS - getTotalAttributePoints();
  };
  const TOTAL_DOMAIN_POINTS = 40;
  const [domainAdjustments, setDomainAdjustments] = useState<DomainAdjustments>({
    intellectualCompetence: 0,
    physicalCompetence: 0,
    emotionalIntelligence: 0,
    socialCompetence: 0,
    personalAutonomy: 0,
    identityClarity: 0,
    lifePurpose: 0
  });

  const handleNameSubmit = () => {
    if (characterName.trim()) {
      setStep(2); // Go directly to attributes (was step 3)
    }
  };

  const handleAttributeChange = (attribute: keyof AttributeValues, value: number) => {
    // Calculate what the total would be with this change
    const currentTotal = getTotalAttributePoints();
    const currentValue = attributes[attribute];
    const newTotal = currentTotal - currentValue + value;
    
    // Only allow the change if it doesn't exceed total points and stays within bounds
    if (newTotal <= TOTAL_ATTRIBUTE_POINTS && value >= MIN_ATTRIBUTE_VALUE && value <= MAX_ATTRIBUTE_VALUE) {
      setAttributes(prev => ({
        ...prev,
        [attribute]: value
      }));
    }
  };

  const handleDomainAdjustment = (domain: keyof DomainAdjustments, value: number) => {
    // Calculate current total points used (excluding the domain being changed)
    const currentTotal = Object.entries(domainAdjustments)
      .filter(([key]) => key !== domain)
      .reduce((sum, [, val]) => sum + val, 0);
    
    // Check if new value would exceed total points
    const newTotal = currentTotal + value;
    
    if (newTotal <= TOTAL_DOMAIN_POINTS && value >= 0 && value <= TOTAL_DOMAIN_POINTS) {
      setDomainAdjustments(prev => ({
        ...prev,
        [domain]: value
      }));
    }
  };

  const getTotalDomainPoints = () => {
    return Object.values(domainAdjustments).reduce((sum, val) => sum + val, 0);
  };
  
  const getAvailableDomainPoints = () => {
    return TOTAL_DOMAIN_POINTS - getTotalDomainPoints();
  };

  const handleFinalize = () => {
    console.log('🔄 Creating character with consolidated stores...');
    
    const validation = validateCharacterCreationData({
      name: characterName,
      background: 'general', // Set default background since selection was removed
      attributes,
      domainAdjustments
    });

    if (!validation.valid) {
      alert('Validation errors:\n' + validation.errors.join('\n'));
      return;
    }
    
    // Create character as new save slot
    const saveId = createCharacterAsSaveSlot({
      name: characterName,
      background: 'general', // Set default background since selection was removed
      attributes,
      domainAdjustments
    });
    
    console.log(`✅ Character creation complete (save ID: ${saveId}) - navigating to planner`);
    navigate('/planner');
  };

  // Step 1: Name
  if (step === 1) {
    return (
      <div className="page-container min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card title="Character Name" variant="elevated">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Choose a name for your character. This will be how you're known throughout your college journey.
                </p>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter character name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={50}
                  autoFocus
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleNameSubmit}
                    disabled={!characterName.trim()}
                    variant="primary"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Attributes (was Step 3)
  if (step === 2) {
    return (
      <div className="page-container min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card title="Set Base Attributes" variant="elevated">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Adjust your character's base attributes. These represent your natural abilities.
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Points remaining: <span className="font-bold">{getAvailableAttributePoints()}</span> / {TOTAL_ATTRIBUTE_POINTS}
                  </p>
                </div>
                
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key}
                      </label>
                      <span className="text-sm text-gray-600">{value}</span>
                    </div>
                    <Slider
                      min={MIN_ATTRIBUTE_VALUE}
                      max={MAX_ATTRIBUTE_VALUE}
                      step={5}
                      value={value}
                      onChange={(newValue) => handleAttributeChange(key as keyof AttributeValues, newValue)}
                      className="w-full"
                    />
                  </div>
                ))}
                
                <div className="flex justify-between mt-6">
                  <Button onClick={() => setStep(1)} variant="outline">
                    ← Back
                  </Button>
                  <Button onClick={() => setStep(3)} variant="primary">
                    Next →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Domain Adjustments (was Step 4)
  if (step === 3) {
    return (
      <div className="page-container min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card title="Domain Adjustments" variant="elevated">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600 mb-2">
                    Fine-tune your character with domain-specific bonuses and penalties.
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Points remaining: <span className="font-bold">{getAvailableDomainPoints()}</span> / {TOTAL_DOMAIN_POINTS}
                  </p>
                </div>
                
                {Object.entries(domainAdjustments).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <span className="text-sm text-gray-600">
                        {value}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={TOTAL_DOMAIN_POINTS}
                      step={1}
                      value={value}
                      onChange={(newValue) => handleDomainAdjustment(key as keyof DomainAdjustments, newValue)}
                      className="w-full"
                    />
                  </div>
                ))}
                
                <div className="flex justify-between mt-6">
                  <Button onClick={() => setStep(2)} variant="outline">
                    ← Back
                  </Button>
                  <Button onClick={() => setStep(4)} variant="primary">
                    Review →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Review & Create (was Step 5)
  return (
    <div className="page-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card title="Review Your Character" variant="elevated">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Basic Info</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{characterName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Background:</dt>
                      <dd className="font-medium capitalize">General</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Final Attributes</h3>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(attributes).map(([key, value]) => {
                      const adjustment = domainAdjustments[key as keyof DomainAdjustments] || 0;
                      const final = Math.max(5, Math.min(100, value + adjustment));
                      return (
                        <div key={key} className="flex justify-between">
                          <dt className="text-gray-600 capitalize">{key}:</dt>
                          <dd className="font-medium">
                            {final}
                            {adjustment !== 0 && (
                              <span className={`ml-2 text-xs ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({adjustment > 0 ? '+' : ''}{adjustment})
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
              
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button onClick={() => setStep(3)} variant="outline">
                  ← Back
                </Button>
                <Button onClick={handleFinalize} variant="primary" size="lg">
                  {isEditing ? 'Update Character' : 'Create Character'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedCharacterCreationFlow;