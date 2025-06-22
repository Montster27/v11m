// /Users/montysharma/V11M2/src/components/contentStudio/AdvancedStoryletCreator.tsx

import React, { useState, useEffect } from 'react';
import { useStoryletStore } from '../../store/useStoryletStore';
import { useClueStore } from '../../store/useClueStore';
import { UndoRedoAction } from '../../hooks/useUndoRedo';
import type { Storylet } from '../../types/storylet';
import HelpTooltip from '../ui/HelpTooltip';
import { safeParseJSON } from '../../utils/validation';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface TriggerCondition {
  id: string;
  type: 'time' | 'resource' | 'skill' | 'relationship' | 'location' | 'random' | 'item' | 'quest' | 'character_state';
  operator: 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'not_equals' | 'contains';
  key: string;
  value: any;
  description?: string;
}

interface StoryletEffect {
  id: string;
  type: 'resource' | 'skill' | 'relationship' | 'item' | 'quest' | 'minigame' | 'clue_discovery' | 'character_state' | 'unlock_location' | 'story_flag';
  target: string;
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'trigger' | 'unlock' | 'complete' | 'discover';
  value: any;
  condition?: string; // Optional condition for conditional effects
  description?: string;
}

interface StoryletChoice {
  id: string;
  text: string;
  conditions: TriggerCondition[];
  effects: StoryletEffect[];
  nextStorylet?: string;
  skillCheck?: {
    skill: string;
    difficulty: number;
    successEffects: StoryletEffect[];
    failureEffects: StoryletEffect[];
  };
}

interface AdvancedStorylet {
  id: string;
  title: string;
  content: string;
  storyArc: string;
  triggers: TriggerCondition[];
  choices: StoryletChoice[];
  effects: StoryletEffect[]; // Effects that happen when storylet appears
  tags: string[];
  weight: number;
  cooldown: number;
  maxActivations: number;
  prerequisites: TriggerCondition[];
  exclusions: string[]; // Storylet IDs that prevent this from appearing
}

interface AdvancedStoryletCreatorProps {
  undoRedoSystem: UndoRedoSystem;
  onExecuteAction: (action: () => void, title: string, message: string, type?: 'warning' | 'danger') => void;
  editingStorylet?: Storylet | null;
  onStoryletSaved?: () => void;
}

const triggerTypes = [
  { value: 'time', label: 'Time-based', description: 'Trigger based on day, week, or specific date' },
  { value: 'resource', label: 'Resource Level', description: 'Trigger when resource reaches certain level' },
  { value: 'skill', label: 'Skill Level', description: 'Trigger when skill reaches certain level' },
  { value: 'relationship', label: 'Relationship', description: 'Trigger based on relationship with character' },
  { value: 'location', label: 'Location', description: 'Trigger when at specific location' },
  { value: 'random', label: 'Random Chance', description: 'Random probability trigger' },
  { value: 'item', label: 'Item Possession', description: 'Trigger when player has/lacks item' },
  { value: 'quest', label: 'Quest Status', description: 'Trigger based on quest progress' },
  { value: 'character_state', label: 'Character State', description: 'Trigger based on character flags' }
];

const effectTypes = [
  { value: 'resource', label: 'Resource Change', description: 'Modify player resources' },
  { value: 'skill', label: 'Skill Change', description: 'Modify player skills' },
  { value: 'relationship', label: 'Relationship Change', description: 'Change relationship with character' },
  { value: 'item', label: 'Item Action', description: 'Give, remove, or modify items' },
  { value: 'quest', label: 'Quest Action', description: 'Start, complete, or modify quest' },
  { value: 'minigame', label: 'Trigger Minigame', description: 'Launch a minigame sequence' },
  { value: 'clue_discovery', label: 'Clue Discovery', description: 'Discover clues through investigation or minigames' },
  { value: 'character_state', label: 'Character State', description: 'Set character flags or states' },
  { value: 'unlock_location', label: 'Unlock Location', description: 'Make new location available' },
  { value: 'story_flag', label: 'Story Flag', description: 'Set story progression flags' }
];

const minigameTypes = [
  { value: 'path_planner', label: 'Path Planner', description: 'Navigation challenge minigame' },
  { value: 'study_session', label: 'Study Session', description: 'Academic challenge minigame' },
  { value: 'social_interaction', label: 'Social Interaction', description: 'Conversation/persuasion minigame' },
  { value: 'resource_management', label: 'Resource Management', description: 'Budget/planning minigame' },
  { value: 'skill_challenge', label: 'Skill Challenge', description: 'Specific skill test minigame' }
];

const operators = [
  { value: 'equals', label: 'Equals (=)' },
  { value: 'greater_than', label: 'Greater Than (>)' },
  { value: 'less_than', label: 'Less Than (<)' },
  { value: 'greater_equal', label: 'Greater or Equal (>=)' },
  { value: 'less_equal', label: 'Less or Equal (<=)' },
  { value: 'not_equals', label: 'Not Equal (!=)' },
  { value: 'contains', label: 'Contains' }
];

const AdvancedStoryletCreator: React.FC<AdvancedStoryletCreatorProps> = ({ 
  undoRedoSystem, 
  onExecuteAction,
  editingStorylet,
  onStoryletSaved
}) => {
  const { addStorylet, updateStorylet, deleteStorylet, storyArcs, addStoryArc, allStorylets } = useStoryletStore();
  const { clues, createClue } = useClueStore();
  
  const [storylet, setStorylet] = useState<AdvancedStorylet>({
    id: `storylet_${Date.now()}`,
    title: '',
    content: '',
    storyArc: '',
    triggers: [],
    choices: [],
    effects: [],
    tags: [],
    weight: 1,
    cooldown: 0,
    maxActivations: 1,
    prerequisites: [],
    exclusions: []
  });

  const [isEditMode, setIsEditMode] = useState(false);

  const [activeSection, setActiveSection] = useState<'basic' | 'triggers' | 'effects' | 'choices' | 'advanced'>('basic');
  
  // Create linked storylet modal state
  const [showCreateLinkedStoryletModal, setShowCreateLinkedStoryletModal] = useState(false);
  const [pendingLinkChoiceId, setPendingLinkChoiceId] = useState<string | null>(null);
  const [newLinkedStorylet, setNewLinkedStorylet] = useState({
    title: '',
    content: '',
    description: ''
  });

  // Convert game storylet to editing format
  const convertGameStoryletToEdit = (gameStorylet: Storylet): AdvancedStorylet => {
    // Convert trigger from game format to editing format
    const convertGameTrigger = (trigger: any): TriggerCondition => {
      const id = generateId();
      
      if (trigger.type === 'time') {
        // Handle time triggers
        const conditions = trigger.conditions || {};
        const dayKey = Object.keys(conditions).find(key => ['day', 'week'].includes(key));
        if (dayKey) {
          const value = conditions[dayKey];
          return {
            id,
            type: 'time',
            operator: typeof value === 'object' ? Object.keys(value)[0] as any : 'greater_equal',
            key: dayKey,
            value: typeof value === 'object' ? String(Object.values(value)[0]) : String(value)
          };
        }
      } else if (trigger.type === 'resource') {
        // Handle resource triggers
        const conditions = trigger.conditions || {};
        const resourceKey = Object.keys(conditions)[0];
        if (resourceKey) {
          const condition = conditions[resourceKey];
          return {
            id,
            type: 'resource',
            operator: typeof condition === 'object' ? Object.keys(condition)[0] as any : 'greater_equal',
            key: resourceKey,
            value: typeof condition === 'object' ? String(Object.values(condition)[0]) : String(condition)
          };
        }
      } else if (trigger.type === 'flag') {
        // Handle flag triggers
        const flags = trigger.conditions?.flags || [];
        if (flags.length > 0) {
          return {
            id,
            type: 'character_state',
            operator: 'equals',
            key: flags[0],
            value: 'true'
          };
        }
      }
      
      // Default fallback
      return {
        id,
        type: 'time',
        operator: 'greater_equal',
        key: 'day',
        value: '1'
      };
    };

    // Convert effect from game format to editing format
    const convertGameEffect = (effect: any): StoryletEffect => {
      const id = generateId();
      
      if (effect.type === 'resource' || effect.type === 'skillXp') {
        return {
          id,
          type: effect.type === 'skillXp' ? 'skill' : 'resource',
          target: effect.key,
          operation: effect.delta > 0 ? 'add' : 'subtract',
          value: Math.abs(effect.delta)
        };
      } else if (effect.type === 'flag') {
        return {
          id,
          type: 'story_flag',
          target: effect.key,
          operation: 'set',
          value: effect.value
        };
      } else if (effect.type === 'minigame') {
        return {
          id,
          type: 'minigame',
          target: effect.gameId || 'path_planner',
          operation: 'trigger',
          value: JSON.stringify(effect.params || {})
        };
      }
      
      // Default fallback
      return {
        id,
        type: 'resource',
        target: 'energy',
        operation: 'add',
        value: 0
      };
    };

    // Convert choice from game format to editing format
    const convertGameChoice = (choice: any): StoryletChoice => {
      return {
        id: choice.id || generateId(),
        text: choice.text || '',
        conditions: [], // Choice conditions not commonly used in current system
        effects: (choice.effects || []).map(convertGameEffect),
        nextStorylet: choice.nextStoryletId
      };
    };

    const triggers = [];
    if (gameStorylet.trigger) {
      // Convert single trigger from game format
      triggers.push(convertGameTrigger(gameStorylet.trigger));
    }

    return {
      id: gameStorylet.id,
      title: gameStorylet.name, // Use 'name' field from Storylet
      content: gameStorylet.description, // Use 'description' field from Storylet 
      storyArc: gameStorylet.storyArc || '',
      triggers,
      choices: (gameStorylet.choices || []).map(convertGameChoice),
      effects: [], // Game storylets don't typically have effects at the storylet level
      tags: [], // Storylet type doesn't have tags field
      weight: 1, // Default values since Storylet doesn't have these fields
      cooldown: 0,
      maxActivations: 1,
      prerequisites: [],
      exclusions: []
    };
  };

  // Initialize with editing storylet if provided
  useEffect(() => {
    if (editingStorylet) {
      setStorylet(convertGameStoryletToEdit(editingStorylet));
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
      setStorylet({
        id: `storylet_${Date.now()}`,
        title: '',
        content: '',
        storyArc: '',
        triggers: [],
        choices: [],
        effects: [],
        tags: [],
        weight: 1,
        cooldown: 0,
        maxActivations: 1,
        prerequisites: [],
        exclusions: []
      });
    }
  }, [editingStorylet]);

  // Generate unique ID
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add trigger condition
  const addTrigger = () => {
    const newTrigger: TriggerCondition = {
      id: generateId(),
      type: 'time',
      operator: 'greater_equal',
      key: 'day',
      value: 1,
      description: ''
    };
    setStorylet(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }));
  };

  // Update trigger
  const updateTrigger = (triggerId: string, updates: Partial<TriggerCondition>) => {
    setStorylet(prev => ({
      ...prev,
      triggers: prev.triggers.map(t => 
        t.id === triggerId ? { ...t, ...updates } : t
      )
    }));
  };

  // Remove trigger
  const removeTrigger = (triggerId: string) => {
    setStorylet(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t.id !== triggerId)
    }));
  };

  // Add effect
  const addEffect = () => {
    const newEffect: StoryletEffect = {
      id: generateId(),
      type: 'resource',
      target: 'energy',
      operation: 'add',
      value: 0,
      description: ''
    };
    setStorylet(prev => ({
      ...prev,
      effects: [...prev.effects, newEffect]
    }));
  };

  // Update effect
  const updateEffect = (effectId: string, updates: Partial<StoryletEffect>) => {
    setStorylet(prev => ({
      ...prev,
      effects: prev.effects.map(e => 
        e.id === effectId ? { ...e, ...updates } : e
      )
    }));
  };

  // Remove effect
  const removeEffect = (effectId: string) => {
    setStorylet(prev => ({
      ...prev,
      effects: prev.effects.filter(e => e.id !== effectId)
    }));
  };

  // Add choice
  const addChoice = () => {
    const newChoice: StoryletChoice = {
      id: generateId(),
      text: 'New choice option',
      conditions: [],
      effects: []
    };
    setStorylet(prev => ({
      ...prev,
      choices: [...prev.choices, newChoice]
    }));
  };

  // Update choice
  const updateChoice = (choiceId: string, updates: Partial<StoryletChoice>) => {
    setStorylet(prev => ({
      ...prev,
      choices: prev.choices.map(c => 
        c.id === choiceId ? { ...c, ...updates } : c
      )
    }));
  };

  // Remove choice
  const removeChoice = (choiceId: string) => {
    setStorylet(prev => ({
      ...prev,
      choices: prev.choices.filter(c => c.id !== choiceId)
    }));
  };

  // Add choice effect
  const addChoiceEffect = (choiceId: string) => {
    const newEffect: StoryletEffect = {
      id: generateId(),
      type: 'resource',
      target: 'energy',
      operation: 'add',
      value: 0
    };
    
    updateChoice(choiceId, {
      effects: [...(storylet.choices.find(c => c.id === choiceId)?.effects || []), newEffect]
    });
  };

  // Update choice effect
  const updateChoiceEffect = (choiceId: string, effectId: string, updates: Partial<StoryletEffect>) => {
    const choice = storylet.choices.find(c => c.id === choiceId);
    if (!choice) return;

    const updatedEffects = choice.effects.map(e => 
      e.id === effectId ? { ...e, ...updates } : e
    );
    
    updateChoice(choiceId, { effects: updatedEffects });
  };

  // Handle create linked storylet modal
  const handleCreateLinkedStorylet = (choiceId: string) => {
    setPendingLinkChoiceId(choiceId);
    setNewLinkedStorylet({
      title: '',
      content: '',
      description: ''
    });
    setShowCreateLinkedStoryletModal(true);
  };

  // Create and link the new storylet
  const createAndLinkStorylet = () => {
    if (!newLinkedStorylet.title.trim() || !pendingLinkChoiceId) {
      return;
    }

    // Create the new storylet
    const newStoryletId = `storylet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newStorylet: Storylet = {
      id: newStoryletId,
      name: newLinkedStorylet.title,
      description: newLinkedStorylet.description || newLinkedStorylet.content,
      trigger: {
        type: 'time',
        conditions: { day: 1 }
      },
      choices: [],
      storyArc: storylet.storyArc,
      deploymentStatus: 'dev'
    };

    // Add the storylet to the store
    addStorylet(newStorylet);

    // Link it to the current choice
    updateChoice(pendingLinkChoiceId, { nextStorylet: newStoryletId });

    // Close modal and reset state
    setShowCreateLinkedStoryletModal(false);
    setPendingLinkChoiceId(null);
    setNewLinkedStorylet({ title: '', content: '', description: '' });
  };

  // Cancel create linked storylet
  const cancelCreateLinkedStorylet = () => {
    setShowCreateLinkedStoryletModal(false);
    setPendingLinkChoiceId(null);
    setNewLinkedStorylet({ title: '', content: '', description: '' });
  };

  // Save storylet
  const saveStorylet = () => {
    // Enhanced validation
    if (!storylet.title || !storylet.content) {
      alert('Please fill in title and content');
      return;
    }

    if (storylet.triggers.length === 0) {
      alert('Please add at least one trigger condition');
      return;
    }

    // Validate triggers
    for (const trigger of storylet.triggers) {
      if (!trigger.key && trigger.type !== 'random' && trigger.type !== 'location') {
        alert(`Trigger "${trigger.type}" is missing a target/key value`);
        return;
      }
      if (!trigger.value && trigger.value !== 0) {
        alert(`Trigger "${trigger.type}" is missing a value`);
        return;
      }
    }

    // Validate effects
    for (const effect of storylet.effects) {
      if (!effect.target) {
        alert(`Effect "${effect.type}" is missing a target`);
        return;
      }
      if (effect.type === 'minigame' && effect.value && typeof effect.value === 'string') {
        const parsed = safeParseJSON(effect.value, null);
        if (parsed === null && effect.value.trim() !== '') {
          alert(`Minigame effect has invalid JSON parameters: ${effect.value}`);
          return;
        }
      }
    }

    // Validate choices
    for (const choice of storylet.choices) {
      if (!choice.text) {
        alert('All choices must have text');
        return;
      }
    }

    // Validate weight and other numeric fields
    if (storylet.weight <= 0) {
      alert('Weight must be greater than 0');
      return;
    }

    if (storylet.maxActivations <= 0) {
      alert('Max activations must be greater than 0');
      return;
    }

    // Convert to game storylet format
    const gameStorylet: Storylet = {
      id: storylet.id,
      name: storylet.title, // Use 'name' field for Storylet
      description: storylet.content, // Use 'description' field for Storylet
      storyArc: storylet.storyArc,
      trigger: storylet.triggers.length === 1 
        ? convertTriggerToGame(storylet.triggers[0]) 
        : {
            type: 'time', // Default to time trigger if multiple triggers
            conditions: { day: 1 }
          },
      choices: storylet.choices.map(convertChoiceToGame),
      deploymentStatus: 'dev'
    };

    const undoRedoAction: UndoRedoAction = {
      id: `${isEditMode ? 'update' : 'create'}_storylet_${Date.now()}`,
      description: `${isEditMode ? 'Update' : 'Create'} storylet "${storylet.title}"`,
      timestamp: new Date(),
      redoAction: () => {
        if (isEditMode) {
          updateStorylet(gameStorylet);
          console.log('✅ Advanced storylet updated:', storylet.title);
        } else {
          addStorylet(gameStorylet);
          console.log('✅ Advanced storylet created:', storylet.title);
        }
      },
      undoAction: () => {
        if (isEditMode && editingStorylet) {
          updateStorylet(editingStorylet);
          console.log('↶ Storylet update undone:', storylet.title);
        } else {
          deleteStorylet(storylet.id);
          console.log('↶ Storylet creation undone:', storylet.title);
        }
      },
      data: { storylet: gameStorylet }
    };

    undoRedoSystem.executeAction(undoRedoAction);
    
    // Notify parent that storylet was saved
    onStoryletSaved?.();
    
    // Reset form only if not in edit mode
    if (!isEditMode) {
      setStorylet({
        id: `storylet_${Date.now()}`,
        title: '',
        content: '',
        storyArc: '',
        triggers: [],
        choices: [],
        effects: [],
        tags: [],
        weight: 1,
        cooldown: 0,
        maxActivations: 1,
        prerequisites: [],
        exclusions: []
      });
    }
  };

  // Convert trigger to game format
  const convertTriggerToGame = (trigger: TriggerCondition) => {
    const numericValue = typeof trigger.value === 'string' ? parseFloat(trigger.value) || 0 : trigger.value;
    
    switch (trigger.type) {
      case 'time':
        // Handle time triggers with operators
        if (trigger.operator === 'equals') {
          return {
            type: 'time',
            conditions: { [trigger.key]: numericValue }
          };
        } else {
          return {
            type: 'time',
            conditions: { [trigger.key]: { [trigger.operator]: numericValue } }
          };
        }
      
      case 'resource':
      case 'skill':
        return {
          type: trigger.type,
          conditions: { [trigger.key]: { [trigger.operator]: numericValue } }
        };
      
      case 'relationship':
        return {
          type: 'relationship',
          conditions: { 
            characterId: trigger.key,
            level: { [trigger.operator]: numericValue }
          }
        };
      
      case 'random':
        return {
          type: 'random',
          conditions: { chance: parseFloat(trigger.value) || 0.5 }
        };
      
      case 'item':
        return {
          type: 'item',
          conditions: { 
            itemId: trigger.key,
            hasItem: trigger.operator === 'equals' ? trigger.value : true
          }
        };
      
      case 'quest':
        return {
          type: 'quest',
          conditions: { 
            questId: trigger.key,
            status: trigger.value
          }
        };
      
      case 'character_state':
        return {
          type: 'character_state',
          conditions: { 
            characterId: trigger.key,
            state: trigger.value
          }
        };
      
      case 'location':
        return {
          type: 'location',
          conditions: { currentLocation: trigger.value }
        };
      
      default:
        return {
          type: trigger.type,
          conditions: { [trigger.key]: trigger.value }
        };
    }
  };

  // Convert choice to game format
  const convertChoiceToGame = (choice: StoryletChoice) => {
    return {
      id: choice.id,
      text: choice.text,
      effects: choice.effects.map(convertEffectToGame),
      conditions: choice.conditions.map(convertTriggerToGame),
      skillCheck: choice.skillCheck,
      nextStoryletId: choice.nextStorylet
    };
  };

  // Convert effect to game format
  const convertEffectToGame = (effect: StoryletEffect) => {
    if (effect.type === 'minigame') {
      return {
        type: 'minigame',
        minigameType: effect.target,
        params: typeof effect.value === 'string' ? safeParseJSON(effect.value || '{}', {}) : effect.value
      };
    }
    
    if (effect.type === 'quest') {
      return {
        type: 'quest',
        questId: effect.target,
        operation: effect.operation,
        value: effect.value
      };
    }
    
    if (effect.type === 'unlock_location') {
      return {
        type: 'unlock_location',
        locationId: effect.target
      };
    }
    
    if (effect.type === 'story_flag') {
      return {
        type: 'story_flag',
        flagName: effect.target,
        value: effect.value
      };
    }
    
    // Handle numeric effects (resources, skills, etc.)
    let deltaValue: number;
    const numericValue = typeof effect.value === 'string' ? parseFloat(effect.value) || 0 : effect.value;
    
    switch (effect.operation) {
      case 'set':
        deltaValue = numericValue;
        break;
      case 'add':
        deltaValue = numericValue;
        break;
      case 'subtract':
        deltaValue = -numericValue;
        break;
      case 'multiply':
        // For multiply, we'll need to handle this differently in the game logic
        return {
          type: effect.type,
          key: effect.target,
          operation: 'multiply',
          multiplier: numericValue
        };
      default:
        deltaValue = numericValue;
    }
    
    return {
      type: effect.type,
      key: effect.target,
      delta: deltaValue
    };
  };

  // Render trigger editor
  const renderTriggerEditor = (trigger: TriggerCondition, index: number) => (
    <div key={trigger.id} className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-800">Trigger {index + 1}</h5>
        <button
          onClick={() => removeTrigger(trigger.id)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={trigger.type}
            onChange={(e) => updateTrigger(trigger.id, { type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            {triggerTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
          <select
            value={trigger.operator}
            onChange={(e) => updateTrigger(trigger.id, { operator: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            {operators.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
          <input
            type="text"
            value={trigger.key}
            onChange={(e) => updateTrigger(trigger.id, { key: e.target.value })}
            placeholder="e.g., day, energy, math_skill"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <input
            type="text"
            value={trigger.value}
            onChange={(e) => updateTrigger(trigger.id, { value: e.target.value })}
            placeholder="Enter value"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <input
          type="text"
          value={trigger.description || ''}
          onChange={(e) => updateTrigger(trigger.id, { description: e.target.value })}
          placeholder="Describe this trigger condition"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );

  // Render effect editor
  const renderEffectEditor = (effect: StoryletEffect, index: number) => (
    <div key={effect.id} className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-800">Effect {index + 1}</h5>
        <button
          onClick={() => removeEffect(effect.id)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={effect.type}
            onChange={(e) => updateEffect(effect.id, { type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            {effectTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
          <select
            value={effect.operation}
            onChange={(e) => updateEffect(effect.id, { operation: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="add">Add/Increase</option>
            <option value="subtract">Subtract/Decrease</option>
            <option value="set">Set To</option>
            <option value="multiply">Multiply By</option>
            {effect.type === 'minigame' && <option value="trigger">Trigger</option>}
            {effect.type === 'clue_discovery' && <option value="discover">Discover</option>}
            {effect.type === 'quest' && <option value="complete">Complete</option>}
            {effect.type === 'unlock_location' && <option value="unlock">Unlock</option>}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {effect.type === 'minigame' ? 'Minigame Type' : 
             effect.type === 'clue_discovery' ? 'Clue' : 'Target'}
          </label>
          {effect.type === 'minigame' ? (
            <select
              value={effect.target}
              onChange={(e) => updateEffect(effect.id, { target: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              {minigameTypes.map(game => (
                <option key={game.value} value={game.value}>{game.label}</option>
              ))}
            </select>
          ) : effect.type === 'clue_discovery' ? (
            <select
              value={effect.target}
              onChange={(e) => updateEffect(effect.id, { target: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Select a clue...</option>
              {clues.map(clue => (
                <option key={clue.id} value={clue.id}>{clue.title}</option>
              ))}
              <option value="__new__">+ Create New Clue</option>
            </select>
          ) : (
            <input
              type="text"
              value={effect.target}
              onChange={(e) => updateEffect(effect.id, { target: e.target.value })}
              placeholder="e.g., energy, math_skill, quest_id"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {effect.type === 'minigame' ? 'Parameters' : 
             effect.type === 'clue_discovery' ? 'Discovery Method' : 'Value'}
          </label>
          {effect.type === 'clue_discovery' ? (
            <select
              value={effect.value}
              onChange={(e) => updateEffect(effect.id, { value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Automatic Discovery</option>
              {minigameTypes.map(game => (
                <option key={game.value} value={game.value}>Via {game.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={effect.value}
              onChange={(e) => updateEffect(effect.id, { value: e.target.value })}
              placeholder={effect.type === 'minigame' ? 'JSON params' : 'Enter value'}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {isEditMode ? 'Advanced Storylet Editor' : 'Advanced Storylet Creator'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditMode 
                ? `Editing: ${storylet.title || 'Untitled Storylet'}` 
                : 'Create sophisticated storylets with complex triggers and effects'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTooltip content="Create complex storylets with multiple triggers, effects, and minigame integration. Use the section tabs to configure different aspects." />
            <button
              onClick={saveStorylet}
              disabled={!storylet.title || !storylet.content || storylet.triggers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditMode ? '💾 Update Storylet' : '💾 Save Storylet'}
            </button>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex">
          {[
            { id: 'basic', label: 'Basic Info', icon: '📝' },
            { id: 'triggers', label: 'Triggers', icon: '⚡' },
            { id: 'effects', label: 'Effects', icon: '🎯' },
            { id: 'choices', label: 'Choices', icon: '🤔' },
            { id: 'advanced', label: 'Advanced', icon: '⚙️' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'text-blue-600 border-blue-600 bg-white'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Storylet Title</label>
              <input
                type="text"
                value={storylet.title}
                onChange={(e) => setStorylet(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter storylet title"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={storylet.content}
                onChange={(e) => setStorylet(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the storylet narrative content..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Story Arc</label>
              <select
                value={storylet.storyArc}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    const newArcName = prompt('Enter name for new story arc:');
                    if (newArcName && newArcName.trim()) {
                      addStoryArc(newArcName.trim());
                      setStorylet(prev => ({ ...prev, storyArc: newArcName.trim() }));
                    }
                  } else {
                    setStorylet(prev => ({ ...prev, storyArc: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No Story Arc --</option>
                {storyArcs.map(arc => (
                  <option key={arc} value={arc}>{arc}</option>
                ))}
                <option value="__new__">+ Create New Arc</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Assign this storylet to a story arc for organization</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                <input
                  type="number"
                  value={storylet.weight}
                  onChange={(e) => setStorylet(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Higher weight = more likely to appear</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cooldown (days)</label>
                <input
                  type="number"
                  value={storylet.cooldown}
                  onChange={(e) => setStorylet(prev => ({ ...prev, cooldown: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Days before can appear again</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Activations</label>
                <input
                  type="number"
                  value={storylet.maxActivations}
                  onChange={(e) => setStorylet(prev => ({ ...prev, maxActivations: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum times this can appear</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                value={storylet.tags.join(', ')}
                onChange={(e) => setStorylet(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                placeholder="Enter tags separated by commas"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Use tags for organization and filtering</p>
            </div>
          </div>
        )}

        {activeSection === 'triggers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-800">Trigger Conditions</h4>
              <button
                onClick={addTrigger}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Trigger
              </button>
            </div>
            
            <p className="text-sm text-gray-600">Define when this storylet should appear. All conditions must be met.</p>
            
            <div className="space-y-4">
              {storylet.triggers.map((trigger, index) => renderTriggerEditor(trigger, index))}
              
              {storylet.triggers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⚡</div>
                  <p>No triggers defined. Add at least one trigger condition.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'effects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-800">Storylet Effects</h4>
              <button
                onClick={addEffect}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Effect
              </button>
            </div>
            
            <p className="text-sm text-gray-600">Effects that occur when this storylet appears (before player choices).</p>
            
            <div className="space-y-4">
              {storylet.effects.map((effect, index) => renderEffectEditor(effect, index))}
              
              {storylet.effects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>No effects defined. Effects are optional but can enhance storytelling.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'choices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-800">Player Choices</h4>
              <button
                onClick={addChoice}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Choice
              </button>
            </div>
            
            <p className="text-sm text-gray-600">Define the choices players can make in response to this storylet.</p>
            
            <div className="space-y-6">
              {storylet.choices.map((choice, index) => (
                <div key={choice.id} className="bg-gray-50 rounded-lg p-6 border">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-800">Choice {index + 1}</h5>
                    <button
                      onClick={() => removeChoice(choice.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Choice
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Choice Text</label>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => updateChoice(choice.id, { text: e.target.value })}
                        placeholder="Enter choice text"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Storylet</label>
                      <select
                        value={choice.nextStorylet || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '__create_new__') {
                            handleCreateLinkedStorylet(choice.id);
                          } else {
                            updateChoice(choice.id, { nextStorylet: value || undefined });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No next storylet</option>
                        <option value="__create_new__" className="text-blue-600 font-medium">
                          ➕ Create New Linked Storylet
                        </option>
                        <optgroup label="Existing Storylets">
                          {Object.values(allStorylets)
                            .filter(s => s.id !== storylet.id) // Don't show self
                            .filter(s => !storylet.storyArc || s.storyArc === storylet.storyArc) // Filter by arc if current storylet has an arc
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} {s.storyArc && `(${s.storyArc})`}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose what storylet follows this choice, or create a new one
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Choice Effects</label>
                        <button
                          onClick={() => addChoiceEffect(choice.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Effect
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {choice.effects.map((effect, effectIndex) => (
                          <div key={effect.id} className="bg-white rounded p-3 border">
                            <div className="grid grid-cols-4 gap-2">
                              <select
                                value={effect.type}
                                onChange={(e) => updateChoiceEffect(choice.id, effect.id, { type: e.target.value as any })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {effectTypes.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                              
                              <input
                                type="text"
                                value={effect.target}
                                onChange={(e) => updateChoiceEffect(choice.id, effect.id, { target: e.target.value })}
                                placeholder="Target"
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              
                              <input
                                type="text"
                                value={effect.value}
                                onChange={(e) => updateChoiceEffect(choice.id, effect.id, { value: e.target.value })}
                                placeholder="Value"
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              
                              <button
                                onClick={() => {
                                  const updatedEffects = choice.effects.filter(e => e.id !== effect.id);
                                  updateChoice(choice.id, { effects: updatedEffects });
                                }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {storylet.choices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🤔</div>
                  <p>No choices defined. Add choices for player interaction.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'advanced' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">Advanced Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions</label>
                  <input
                    type="text"
                    value={storylet.exclusions.join(', ')}
                    onChange={(e) => setStorylet(prev => ({ 
                      ...prev, 
                      exclusions: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                    }))}
                    placeholder="Storylet IDs that prevent this from appearing"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list of storylet IDs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">💡 Pro Tips</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use weight to control how often storylets appear</li>
                <li>• Set cooldowns to prevent repetitive content</li>
                <li>• Use tags for organizational purposes</li>
                <li>• Test minigame integration thoroughly</li>
                <li>• Consider using exclusions for mutually exclusive storylines</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Create Linked Storylet Modal */}
      {showCreateLinkedStoryletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Linked Storylet</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will create a new storylet and automatically link it to the current choice.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storylet Title *
                </label>
                <input
                  type="text"
                  value={newLinkedStorylet.title}
                  onChange={(e) => setNewLinkedStorylet(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter storylet title"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newLinkedStorylet.description}
                  onChange={(e) => setNewLinkedStorylet(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the storylet"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> The new storylet will inherit the same story arc as the current storylet 
                  {storylet.storyArc && ` (${storylet.storyArc})`} and will be created with development status.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelCreateLinkedStorylet}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createAndLinkStorylet}
                disabled={!newLinkedStorylet.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Link Storylet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStoryletCreator;