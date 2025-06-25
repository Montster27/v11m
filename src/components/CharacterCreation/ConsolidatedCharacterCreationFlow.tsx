// /Users/montysharma/V11M2/src/components/CharacterCreation/ConsolidatedCharacterCreationFlow.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoreGameStore, useNarrativeStore } from '../../stores/v2';
import { createCharacterAtomically, validateCharacterCreationData } from '../../utils/characterFlowIntegration';
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
  const isEditing = coreStore.character.name !== '';
  
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState(coreStore.character.name || '');
  const [selectedBackground, setSelectedBackground] = useState(coreStore.character.background || '');
  const [attributes, setAttributes] = useState<AttributeValues>({
    intelligence: 50,
    creativity: 50,
    charisma: 50,
    strength: 50,
    focus: 50,
    empathy: 50
  });
  const [domainAdjustments, setDomainAdjustments] = useState<DomainAdjustments>({
    intellectualCompetence: 0,
    physicalCompetence: 0,
    emotionalIntelligence: 0,
    socialCompetence: 0,
    personalAutonomy: 0,
    identityClarity: 0,
    lifePurpose: 0
  });

  const backgrounds = [
    { id: 'scholar', name: 'Scholar', description: 'Focused on academics and learning' },
    { id: 'athlete', name: 'Athlete', description: 'Strong physical abilities and team spirit' },
    { id: 'artist', name: 'Artist', description: 'Creative and expressive personality' },
    { id: 'social', name: 'Social Butterfly', description: 'Excellent at making connections' }
  ];

  const handleNameSubmit = () => {
    if (characterName.trim()) {
      setStep(2);
    }
  };

  const handleBackgroundSelect = (background: string) => {
    setSelectedBackground(background);
    setStep(3);
  };

  const handleAttributeChange = (attribute: keyof AttributeValues, value: number) => {
    setAttributes(prev => ({
      ...prev,
      [attribute]: value
    }));
  };

  const handleDomainAdjustment = (domain: keyof DomainAdjustments, value: number) => {
    const totalUsed = Object.values(domainAdjustments).reduce((sum, val) => sum + Math.abs(val), 0) - Math.abs(domainAdjustments[domain]) + Math.abs(value);
    
    if (totalUsed <= 40) {
      setDomainAdjustments(prev => ({
        ...prev,
        [domain]: value
      }));
    }
  };

  const getTotalDomainPoints = () => {
    return Object.values(domainAdjustments).reduce((sum, val) => sum + Math.abs(val), 0);
  };

  const handleFinalize = () => {
    console.log('🔄 Creating character with consolidated stores...');
    
    const validation = validateCharacterCreationData({
      name: characterName,
      background: selectedBackground,
      attributes,
      domainAdjustments
    });

    if (!validation.valid) {
      alert('Validation errors:\n' + validation.errors.join('\n'));
      return;
    }
    
    // Single atomic operation across all stores
    createCharacterAtomically({
      name: characterName,
      background: selectedBackground,
      attributes,
      domainAdjustments
    });
    
    console.log('✅ Character creation complete - navigating to planner');
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

  // Step 2: Background
  if (step === 2) {
    return (
      <div className="page-container min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card title="Choose Your Background" variant="elevated">
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  Your background influences your starting skills and how you approach college life.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handleBackgroundSelect(bg.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedBackground === bg.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{bg.name}</h3>
                      <p className="text-sm text-gray-600">{bg.description}</p>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button onClick={() => setStep(1)} variant="outline">
                    ← Back
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Attributes
  if (step === 3) {
    return (
      <div className="page-container min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card title="Set Base Attributes" variant="elevated">
              <div className="space-y-6">
                <p className="text-gray-600">
                  Adjust your character's base attributes. These represent your natural abilities.
                </p>
                
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key}
                      </label>
                      <span className="text-sm text-gray-600">{value}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={value}
                      onChange={(newValue) => handleAttributeChange(key as keyof AttributeValues, newValue)}
                      className="w-full"
                    />
                  </div>
                ))}
                
                <div className="flex justify-between mt-6">
                  <Button onClick={() => setStep(2)} variant="outline">
                    ← Back
                  </Button>
                  <Button onClick={() => setStep(4)} variant="primary">
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

  // Step 4: Domain Adjustments
  if (step === 4) {
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
                  <p className="text-sm text-gray-500">
                    You have <span className="font-bold">{40 - getTotalDomainPoints()}</span> points remaining (40 total)
                  </p>
                </div>
                
                {Object.entries(domainAdjustments).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <span className="text-sm text-gray-600">
                        {value > 0 ? '+' : ''}{value}
                      </span>
                    </div>
                    <Slider
                      min={-20}
                      max={20}
                      step={5}
                      value={value}
                      onChange={(newValue) => handleDomainAdjustment(key as keyof DomainAdjustments, newValue)}
                      className="w-full"
                    />
                  </div>
                ))}
                
                <div className="flex justify-between mt-6">
                  <Button onClick={() => setStep(3)} variant="outline">
                    ← Back
                  </Button>
                  <Button onClick={() => setStep(5)} variant="primary">
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

  // Step 5: Review & Create
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
                      <dd className="font-medium capitalize">{selectedBackground}</dd>
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
                <Button onClick={() => setStep(4)} variant="outline">
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