// /Users/montysharma/V11M2/src/components/contentStudio/StoryCreatorWizard.tsx

import React, { useState } from 'react';
import { useStoryletStore } from '../../store/useStoryletStore';
import { UndoRedoAction } from '../../hooks/useUndoRedo';
import HelpTooltip from '../ui/HelpTooltip';

// Helper function to safely extract numeric values from condition objects
const extractNumericValue = (value: any): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    // Handle operator objects like {greater_equal: 5}
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const [, operatorValue] = entries[0];
      if (typeof operatorValue === 'number') {
        return operatorValue;
      }
    }
  }
  return 0;
};

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface StoryCreatorWizardProps {
  onExecuteAction: (action: () => void, title: string, message: string, type?: 'warning' | 'danger') => void;
  undoRedoSystem: UndoRedoSystem;
}

interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  template: {
    trigger: any;
    choices: any[];
    tags?: string[];
  };
}

const storyTemplates: StoryTemplate[] = [
  {
    id: 'chance_encounter',
    name: 'Chance Encounter',
    description: 'Meet someone new with dialogue choices',
    icon: '👋',
    template: {
      trigger: { type: 'time', conditions: { day: 1 } },
      choices: [
        { id: 'friendly', text: 'Approach with a friendly greeting', effects: [] },
        { id: 'cautious', text: 'Nod politely and continue', effects: [] },
        { id: 'ignore', text: 'Pretend not to notice', effects: [] }
      ],
      tags: ['social', 'casual']
    }
  },
  {
    id: 'academic_challenge',
    name: 'Academic Challenge',
    description: 'Study decision affecting knowledge and stress',
    icon: '📚',
    template: {
      trigger: { type: 'time', conditions: { week: 2 } },
      choices: [
        { 
          id: 'intensive_study', 
          text: 'Study intensively for the test', 
          effects: [
            { type: 'resource', key: 'knowledge', delta: 15 },
            { type: 'resource', key: 'stress', delta: 10 }
          ]
        },
        { 
          id: 'moderate_study', 
          text: 'Study at a steady pace', 
          effects: [
            { type: 'resource', key: 'knowledge', delta: 8 },
            { type: 'resource', key: 'stress', delta: 3 }
          ]
        }
      ],
      tags: ['academic', 'knowledge']
    }
  },
  {
    id: 'social_event',
    name: 'Social Event',
    description: 'Party or gathering with social consequences',
    icon: '🎉',
    template: {
      trigger: { type: 'time', conditions: { week: 3 } },
      choices: [
        { 
          id: 'attend', 
          text: 'Attend the party', 
          effects: [
            { type: 'resource', key: 'social', delta: 12 },
            { type: 'resource', key: 'energy', delta: -8 }
          ]
        },
        { 
          id: 'skip', 
          text: 'Stay in and rest', 
          effects: [
            { type: 'resource', key: 'energy', delta: 5 },
            { type: 'resource', key: 'social', delta: -3 }
          ]
        }
      ],
      tags: ['social', 'party']
    }
  }
];

const StoryCreatorWizard: React.FC<StoryCreatorWizardProps> = ({ onExecuteAction, undoRedoSystem }) => {
  const { addStorylet, removeStorylet } = useStoryletStore();
  const [step, setStep] = useState<'template' | 'details' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const [storyData, setStoryData] = useState({
    id: '',
    title: '',
    description: '',
    trigger: { type: 'time', conditions: { day: 1 } },
    choices: []
  });

  const storyletStore = useStoryletStore();

  const handleTemplateSelect = (template: StoryTemplate) => {
    setSelectedTemplate(template);
    setStoryData({
      id: `custom_${Date.now()}`,
      title: '',
      description: '',
      ...template.template
    });
    setStep('details');
  };

  const handleCreateStory = () => {
    if (!storyData.title || !storyData.description) {
      alert('Please fill in all required fields');
      return;
    }

    // Create storylet object
    const newStorylet = {
      id: storyData.id,
      title: storyData.title,
      content: storyData.description,
      trigger: storyData.trigger,
      choices: storyData.choices,
      tags: selectedTemplate?.template.tags || [],
      isActive: true,
      weight: 1,
      cooldown: 0,
      maxActivations: 1
    };

    // Create undo/redo action
    const undoRedoAction: UndoRedoAction = {
      id: `create_story_${Date.now()}`,
      description: `Create story "${storyData.title}"`,
      timestamp: new Date(),
      redoAction: () => {
        addStorylet(newStorylet);
        console.log('✅ Story created:', storyData.title);
      },
      undoAction: () => {
        removeStorylet(storyData.id);
        console.log('↶ Story creation undone:', storyData.title);
      },
      data: { storylet: newStorylet }
    };

    // Execute with undo/redo system
    undoRedoSystem.executeAction(undoRedoAction);
    
    // Reset wizard
    setStep('template');
    setSelectedTemplate(null);
    setStoryData({
      id: '',
      title: '',
      description: '',
      trigger: { type: 'time', conditions: { day: 1 } },
      choices: []
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center ${step === 'template' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <span className="ml-2 font-medium">Choose Template</span>
        </div>
        
        <div className="w-8 h-px bg-gray-300" />
        
        <div className={`flex items-center ${step === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="ml-2 font-medium">Add Details</span>
        </div>
        
        <div className="w-8 h-px bg-gray-300" />
        
        <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            3
          </div>
          <span className="ml-2 font-medium">Preview & Create</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Story Creator Wizard</h3>
        <p className="text-gray-600">Create engaging storylets with guided workflows and templates</p>
      </div>

      {renderStepIndicator()}

      {step === 'template' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-lg font-medium">Choose a Story Template</h4>
            <HelpTooltip content="Templates provide pre-built story structures that you can customize. Each template includes common choices and effects to get you started quickly." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storyTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{template.icon}</span>
                  <h5 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {template.name}
                  </h5>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex gap-1">
                  {template.template.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Start with templates to learn story structure</li>
              <li>• Customize choices and effects to fit your narrative</li>
              <li>• Use Preview Mode to test before publishing</li>
            </ul>
          </div>
        </div>
      )}

      {step === 'details' && selectedTemplate && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Story Details</h4>
            <button
              onClick={() => setStep('template')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to Templates
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Story Title *
              </label>
              <input
                type="text"
                value={storyData.title}
                onChange={(e) => setStoryData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a compelling story title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Story Description *
              </label>
              <textarea
                value={storyData.description}
                onChange={(e) => setStoryData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what happens in this story..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When does this story appear?
              </label>
              <select
                value={extractNumericValue(storyData.trigger.conditions.day) || extractNumericValue(storyData.trigger.conditions.week)}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setStoryData(prev => ({
                    ...prev,
                    trigger: {
                      type: 'time',
                      conditions: value <= 7 ? { day: value } : { week: Math.ceil(value / 7) }
                    }
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Day 1 (Immediate)</option>
                <option value={3}>Day 3 (Early)</option>
                <option value={7}>Day 7 (End of first week)</option>
                <option value={14}>Day 14 (Second week)</option>
                <option value={21}>Day 21 (Third week)</option>
              </select>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('template')}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Back
              </button>
              <button
                onClick={() => setStep('preview')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!storyData.title || !storyData.description}
              >
                Preview Story
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Preview Your Story</h4>
            <button
              onClick={() => setStep('details')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Edit Details
            </button>
          </div>

          <div className="bg-gray-50 border rounded-lg p-6 mb-6">
            <h5 className="text-lg font-semibold mb-2">{storyData.title}</h5>
            <p className="text-gray-600 mb-4">{storyData.description}</p>
            
            <div className="space-y-2">
              <h6 className="font-medium text-gray-700">Player Choices:</h6>
              {selectedTemplate?.template.choices.map((choice: any, index: number) => (
                <div key={index} className="p-3 bg-white border rounded">
                  <div className="font-medium">{choice.text}</div>
                  {choice.effects && choice.effects.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Effects: {choice.effects.map((effect: any) => 
                        `${effect.key} ${effect.delta > 0 ? '+' : ''}${effect.delta}`
                      ).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('details')}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Back to Edit
            </button>
            <button
              onClick={handleCreateStory}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreatorWizard;