// /Users/montysharma/V11M2/src/components/CharacterCreation/Step3_Questionnaire.tsx
import React, { useState } from 'react';
import { useCharacterStore, questionnaireData } from '../../store/characterStore';
import { Card, Button } from '../ui';
import { Character } from '../../types/character';

const Step3_Questionnaire: React.FC = () => {
  const { currentCharacter, updateCharacter, nextStep, prevStep } = useCharacterStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [showSummary, setShowSummary] = useState(false);

  const handleAnswer = (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    // Apply attribute effects
    const question = questionnaireData.find(q => q.id === questionId);
    const option = question?.options.find(o => o.id === optionId);
    
    if (option && currentCharacter?.attributes) {
      const updatedAttributes = { ...currentCharacter.attributes };
      
      option.attributeEffects.forEach(effect => {
        const currentValue = updatedAttributes[effect.attribute];
        const newValue = Math.max(1, Math.min(10, currentValue + effect.change));
        updatedAttributes[effect.attribute] = newValue;
      });
      
      updateCharacter({ attributes: updatedAttributes });
    }

    // Move to next question or show summary
    if (currentQuestion < questionnaireData.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
    } else {
      setTimeout(() => setShowSummary(true), 500);
    }
  };

  const resetQuestionnaire = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowSummary(false);
  };

  const getAttributeChanges = () => {
    const changes: { [key: string]: number } = {};
    
    Object.entries(answers).forEach(([questionId, optionId]) => {
      const question = questionnaireData.find(q => q.id === questionId);
      const option = question?.options.find(o => o.id === optionId);
      
      option?.attributeEffects.forEach(effect => {
        changes[effect.attribute] = (changes[effect.attribute] || 0) + effect.change;
      });
    });
    
    return changes;
  };

  if (showSummary) {
    const attributeChanges = getAttributeChanges();
    
    return (
      <Card title="Step 3: Questionnaire Complete" className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Questionnaire Complete!</h2>
            <p className="text-gray-600">
              Based on your answers, we've made some adjustments to your character attributes.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-3">Attribute Changes Applied:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(attributeChanges).map(([attr, change]) => (
                <div key={attr} className="flex justify-between">
                  <span className="capitalize text-blue-800">
                    {attr.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className={`font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Your Answers:</h3>
            <div className="space-y-2 text-sm">
              {questionnaireData.map((question, index) => {
                const selectedOptionId = answers[question.id];
                const selectedOption = question.options.find(o => o.id === selectedOptionId);
                
                return (
                  <div key={question.id}>
                    <p className="text-gray-700">
                      <strong>Q{index + 1}:</strong> {question.question}
                    </p>
                    {selectedOption && (
                      <p className="text-blue-600 ml-4">→ {selectedOption.text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button onClick={resetQuestionnaire} variant="outline">
              Retake Questionnaire
            </Button>
            
            <div className="flex space-x-3">
              <Button onClick={prevStep} variant="outline">
                Back: Attributes
              </Button>
              <Button onClick={nextStep} variant="primary">
                Next: Review
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const question = questionnaireData[currentQuestion];
  const progress = ((currentQuestion + 1) / questionnaireData.length) * 100;

  return (
    <Card title="Step 3: Life Questionnaire" className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
          <p className="text-gray-600 mb-4">
            Answer these questions to fine-tune your character attributes based on your personality.
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questionnaireData.length}
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {question.question}
          </h3>
          
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(question.id, option.id)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-gray-900 group-hover:text-blue-900">
                    {option.text}
                  </span>
                  <div className="flex flex-wrap gap-1 ml-4">
                    {option.attributeEffects.map((effect, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          effect.change > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {effect.attribute}: {effect.change > 0 ? '+' : ''}{effect.change}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={prevStep} variant="outline">
            Back: Attributes
          </Button>
          
          <Button 
            onClick={() => setShowSummary(true)} 
            variant="outline"
          >
            Skip Questionnaire
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Step3_Questionnaire;