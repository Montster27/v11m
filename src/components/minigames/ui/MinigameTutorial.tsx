// /Users/montysharma/V11M2/src/components/minigames/ui/MinigameTutorial.tsx
// Enhanced tutorial component for minigames

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../ui';
import { MinigamePlugin } from '../core/types';

interface MinigameTutorialProps {
  plugin: MinigamePlugin;
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  title: string;
  content: string;
  visual?: string;
  controls?: string[];
  tips?: string[];
}

const MinigameTutorial: React.FC<MinigameTutorialProps> = ({
  plugin,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate tutorial steps based on plugin metadata
  const generateTutorialSteps = (plugin: MinigamePlugin): TutorialStep[] => {
    const steps: TutorialStep[] = [
      {
        title: `Welcome to ${plugin.name}`,
        content: plugin.description,
        visual: '🎮'
      }
    ];

    // Add objective step
    if (plugin.helpText) {
      steps.push({
        title: 'Objective',
        content: plugin.helpText,
        visual: '🎯'
      });
    }

    // Add controls step
    if (plugin.controls && plugin.controls.length > 0) {
      steps.push({
        title: 'Controls',
        content: 'Learn how to interact with the game:',
        controls: plugin.controls,
        visual: '🎲'
      });
    }

    // Add category-specific tips
    const categoryTips = getCategoryTips(plugin.category);
    if (categoryTips.length > 0) {
      steps.push({
        title: 'Pro Tips',
        content: `Here are some tips for ${plugin.category} games:`,
        tips: categoryTips,
        visual: '💡'
      });
    }

    // Add difficulty info
    steps.push({
      title: 'Difficulty Levels',
      content: 'This game supports multiple difficulty levels that adapt to your performance.',
      tips: [
        'Easy: Slower pace, more time',
        'Medium: Balanced challenge',
        'Hard: Faster pace, less time',
        'Expert: Maximum challenge'
      ],
      visual: '⚡'
    });

    // Add final step
    steps.push({
      title: 'Ready to Play!',
      content: `You're all set to play ${plugin.name}. Good luck!`,
      visual: '🚀'
    });

    return steps;
  };

  const getCategoryTips = (category: string): string[] => {
    const tipsByCategory: Record<string, string[]> = {
      memory: [
        'Focus on patterns and sequences',
        'Take your time to memorize before acting',
        'Use visualization techniques'
      ],
      puzzle: [
        'Look for patterns and relationships',
        'Try different approaches if stuck',
        'Take breaks if feeling frustrated'
      ],
      reflex: [
        'Stay relaxed and focused',
        'React quickly but accurately',
        'Practice improves reaction time'
      ],
      strategy: [
        'Think ahead and plan moves',
        'Consider multiple options',
        'Learn from each attempt'
      ],
      coordination: [
        'Maintain steady hand movements',
        'Focus on precision over speed',
        'Use consistent timing'
      ]
    };

    return tipsByCategory[category] || [
      'Stay focused and have fun',
      'Practice makes perfect',
      'Don\'t give up if it seems difficult'
    ];
  };

  const tutorialSteps = generateTutorialSteps(plugin);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full m-4 relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tutorial</h1>
              <p className="text-blue-100 mt-1">{plugin.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-2">{currentStepData.visual}</div>
              <div className="text-sm text-blue-200">
                Step {currentStep + 1} of {tutorialSteps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-1">
          <div 
            className="bg-blue-500 h-1 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className={`p-6 transition-opacity duration-150 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentStepData.title}
          </h2>
          
          <p className="text-gray-700 mb-6 leading-relaxed">
            {currentStepData.content}
          </p>

          {/* Controls Section */}
          {currentStepData.controls && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-3">Controls:</h3>
              <div className="grid grid-cols-1 gap-2">
                {currentStepData.controls.map((control, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800 text-sm">{control}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Section */}
          {currentStepData.tips && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-yellow-900 mb-3">
                {currentStepData.title === 'Pro Tips' ? 'Tips:' : 'Levels:'}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {currentStepData.tips.map((tip, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-800 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Info */}
          {currentStep === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Category</div>
                <div className="font-medium text-gray-900 capitalize">{plugin.category}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-medium text-gray-900">
                  {Math.floor(plugin.estimatedDuration / 60)}m {plugin.estimatedDuration % 60}s
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Load</div>
                <div className="font-medium text-gray-900 capitalize">{plugin.cognitiveLoad}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Skills</div>
                <div className="font-medium text-gray-900 text-xs">
                  {plugin.requiredSkills?.length || 0} skills
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="flex space-x-3">
            <Button 
              onClick={onSkip} 
              variant="outline"
              className="text-gray-600"
            >
              Skip Tutorial
            </Button>
            {currentStep > 0 && (
              <Button 
                onClick={prevStep}
                variant="outline"
              >
                Previous
              </Button>
            )}
          </div>
          
          <Button 
            onClick={nextStep}
            variant="primary"
            className="min-w-[100px]"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Start Game' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MinigameTutorial;