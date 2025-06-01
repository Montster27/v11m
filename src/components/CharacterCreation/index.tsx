// /Users/montysharma/V11M2/src/components/CharacterCreation/index.tsx
import React from 'react';
import { useCharacterStore } from '../../store/characterStore';
import Step1_Name from './Step1_Name';
import Step2_Attributes from './Step2_Attributes';
import Step3_Review from './Step3_Review';

const CharacterCreation: React.FC = () => {
  const { currentStep } = useCharacterStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1_Name />;
      case 2:
        return <Step2_Attributes />;
      case 3:
        return <Step3_Review />;
      default:
        return <Step1_Name />;
    }
  };

  const steps = [
    { number: 1, title: 'Name', description: 'Character Name' },
    { number: 2, title: 'Attributes', description: 'Distribute Points' },
    { number: 3, title: 'Review', description: 'Finalize Character' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 mt-[-20px]
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="transition-all duration-300">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;