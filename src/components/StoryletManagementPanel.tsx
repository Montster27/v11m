// /Users/montysharma/V11M2/src/components/StoryletManagementPanel.tsx
import React, { useState, useEffect } from 'react';
import { useStoryletStore } from '../store/useStoryletStore';
import { useAppStore } from '../store/useAppStore';
import { Button, Card } from './ui';
import type { Storylet, Effect, MinigameType } from '../types/storylet';
import { FileEditingService } from '../services/fileEditingService';

type TabType = 'all' | 'active' | 'completed' | 'debug' | 'create' | 'edit';

interface NewStoryletForm {
  id: string;
  name: string;
  description: string;
  triggerType: 'time' | 'resource' | 'flag';
  triggerConditions: any;
  choices: {
    id: string;
    text: string;
    effects: any[];
    nextStoryletId?: string;
  }[];
}

const StoryletManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedStorylet, setSelectedStorylet] = useState<Storylet | null>(null);
  const [editingStorylet, setEditingStorylet] = useState<Storylet | null>(null);
  const [editForm, setEditForm] = useState<NewStoryletForm | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [newStoryletForm, setNewStoryletForm] = useState<NewStoryletForm>({
    id: '',
    name: '',
    description: '',
    triggerType: 'time',
    triggerConditions: {},
    choices: [{
      id: 'choice_1',
      text: '',
      effects: [],
      nextStoryletId: ''
    }]
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const {
    allStorylets,
    activeStoryletIds,
    completedStoryletIds,
    activeFlags,
    storyletCooldowns,
    evaluateStorylets,
    unlockStorylet,
    addStorylet,
    resetStorylets,
    setFlag
  } = useStoryletStore();
  
  const { day, resources, updateResource, resetGame } = useAppStore();

  // Add storylet to store (this function handles both new and updates)
  const updateStoryletInStore = (storylet: Storylet) => {
    // For now, we'll add it to the store. In a real system, you'd want to update the original data
    addStorylet(storylet);
  };

  // Save storylet to file (automatically edit the original data file)
  const saveStoryletToFile = async (storylet: Storylet) => {
    return await FileEditingService.saveStoryletToFile(storylet);
  };

  // Auto-refresh debug info
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({
        currentDay: day,
        resources: { ...resources },
        activeFlags: { ...activeFlags },
        activeStoryletIds: [...activeStoryletIds],
        completedStoryletIds: [...completedStoryletIds],
        cooldowns: { ...storyletCooldowns }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [day, resources, activeFlags, activeStoryletIds, completedStoryletIds, storyletCooldowns]);

  const tabs = [
    { id: 'all' as TabType, label: 'All Storylets', count: Object.keys(allStorylets).length },
    { id: 'active' as TabType, label: 'Active', count: activeStoryletIds.length },
    { id: 'completed' as TabType, label: 'Completed', count: completedStoryletIds.length },
    { id: 'debug' as TabType, label: 'Debug', count: null },
    { id: 'create' as TabType, label: 'Create New', count: null },
    { id: 'edit' as TabType, label: 'Edit Storylet', count: null }
  ];

  const getTriggerColor = (trigger: any) => {
    switch (trigger.type) {
      case 'time': return 'bg-blue-100 text-blue-800';
      case 'resource': return 'bg-green-100 text-green-800';
      case 'flag': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const evaluateTrigger = (storylet: Storylet): { canTrigger: boolean; reason: string } => {
    const trigger = storylet.trigger;
    
    // Skip if already active or completed
    if (activeStoryletIds.includes(storylet.id)) {
      return { canTrigger: false, reason: 'Already active' };
    }
    
    if (completedStoryletIds.includes(storylet.id) && trigger.type !== 'resource') {
      return { canTrigger: false, reason: 'Already completed (non-resource)' };
    }
    
    // Check cooldown
    if (storyletCooldowns[storylet.id] && day < storyletCooldowns[storylet.id]) {
      return { canTrigger: false, reason: `On cooldown until day ${storyletCooldowns[storylet.id]}` };
    }
    
    switch (trigger.type) {
      case 'time':
        if (trigger.conditions.day && day >= trigger.conditions.day) {
          return { canTrigger: true, reason: `Day ${day} >= ${trigger.conditions.day}` };
        }
        return { canTrigger: false, reason: `Day ${day} < ${trigger.conditions.day}` };
        
      case 'resource':
        const checks = Object.entries(trigger.conditions).map(([resource, condition]: [string, any]) => {
          const value = resources[resource as keyof typeof resources];
          if (condition.min !== undefined && value < condition.min) {
            return `${resource}: ${value} < ${condition.min}`;
          }
          if (condition.max !== undefined && value > condition.max) {
            return `${resource}: ${value} > ${condition.max}`;
          }
          return null;
        }).filter(Boolean);
        
        if (checks.length === 0) {
          return { canTrigger: true, reason: 'All resource conditions met' };
        }
        return { canTrigger: false, reason: `Resource conditions not met: ${checks.join(', ')}` };
        
      case 'flag':
        const requiredFlags = trigger.conditions.flags || [];
        const missingFlags = requiredFlags.filter((flag: string) => !activeFlags[flag]);
        
        if (missingFlags.length === 0 && requiredFlags.length > 0) {
          return { canTrigger: true, reason: `All flags present: ${requiredFlags.join(', ')}` };
        }
        return { canTrigger: false, reason: `Missing flags: ${missingFlags.join(', ')}` };
        
      default:
        return { canTrigger: false, reason: 'Unknown trigger type' };
    }
  };

  // Export storylet as JSON
  const exportStoryletJSON = (storylet: Storylet) => {
    const jsonString = JSON.stringify({ [storylet.id]: storylet }, null, 2);
    
    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString).then(() => {
        alert('Storylet JSON copied to clipboard!');
      }).catch(() => {
        // Fallback: log to console
        console.log('📋 Storylet JSON:', jsonString);
        alert('Storylet JSON logged to console (clipboard not available)');
      });
    } else {
      // Fallback: log to console
      console.log('📋 Storylet JSON:', jsonString);
      alert('Storylet JSON logged to console (clipboard not available)');
    }
  };

  const forceUnlockStorylet = (storyletId: string) => {
    unlockStorylet(storyletId);
    evaluateStorylets(); // Re-evaluate after unlock
  };

  // Convert storylet to editable form
  const storyletToForm = (storylet: Storylet): NewStoryletForm => {
    return {
      id: storylet.id,
      name: storylet.name,
      description: storylet.description,
      triggerType: storylet.trigger.type,
      triggerConditions: storylet.trigger.conditions,
      choices: storylet.choices.map(choice => ({
        id: choice.id,
        text: choice.text,
        effects: choice.effects,
        nextStoryletId: choice.nextStoryletId || ''
      }))
    };
  };

  // Start editing a storylet
  const startEditingStorylet = (storylet: Storylet) => {
    setEditingStorylet(storylet);
    setEditForm(storyletToForm(storylet));
    setActiveTab('edit');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingStorylet(null);
    setEditForm(null);
    setValidationErrors([]);
    setActiveTab('all');
  };

  // Save edited storylet
  const saveEditedStorylet = async () => {
    if (!editForm || !editingStorylet) return;
    
    const errors = validateStoryletForm(editForm);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    const updatedStorylet: Storylet = {
      id: editForm.id,
      name: editForm.name,
      description: editForm.description,
      trigger: {
        type: editForm.triggerType,
        conditions: editForm.triggerConditions
      },
      choices: editForm.choices.map(choice => ({
        id: choice.id,
        text: choice.text,
        effects: choice.effects,
        ...(choice.nextStoryletId && { nextStoryletId: choice.nextStoryletId })
      }))
    };
    
    try {
      // Update in runtime store
      updateStoryletInStore(updatedStorylet);
      
      // Attempt to save to file and copy to clipboard
      const copiedToClipboard = await saveStoryletToFile(updatedStorylet);
      
      console.log('✏️ Storylet Updated:', updatedStorylet);
      
      const message = copiedToClipboard 
        ? `Storylet "${updatedStorylet.name}" updated successfully!\n\n✅ Runtime: Changes are active in current session\n💾 File: JSON file download attempted (modern browsers)\n📋 Clipboard: JSON copied as backup\n\nCheck console for detailed instructions.`
        : `Storylet "${updatedStorylet.name}" updated successfully!\n\n✅ Runtime: Changes are active in current session\n📝 Manual: Check console for JSON to copy\n\n⚠️ Note: Changes will reset on page reload until you update the data file.`;
      
      alert(message);
      
      // Reset editing state
      cancelEditing();
      
    } catch (error) {
      console.error('Failed to update storylet:', error);
      alert('Failed to update storylet. Check console for details.');
    }
  };

  const validateStoryletForm = (form?: NewStoryletForm): string[] => {
    const formToValidate = form || newStoryletForm;
    const errors: string[] = [];
    
    if (!formToValidate.id.trim()) errors.push('Storylet ID is required');
    if (!formToValidate.name.trim()) errors.push('Storylet name is required');
    if (!formToValidate.description.trim()) errors.push('Description is required');
    
    // Check if ID already exists (skip check if editing the same storylet)
    if (allStorylets[formToValidate.id] && (!editingStorylet || editingStorylet.id !== formToValidate.id)) {
      errors.push('Storylet ID already exists');
    }
    
    // Validate trigger conditions
    if (formToValidate.triggerType === 'time') {
      if (!formToValidate.triggerConditions.day || formToValidate.triggerConditions.day < 1) {
        errors.push('Time trigger requires a day value >= 1');
      }
    } else if (formToValidate.triggerType === 'resource') {
      const conditions = formToValidate.triggerConditions;
      if (!conditions || Object.keys(conditions).length === 0) {
        errors.push('Resource trigger requires at least one resource condition');
      }
    } else if (formToValidate.triggerType === 'flag') {
      if (!formToValidate.triggerConditions.flags || formToValidate.triggerConditions.flags.length === 0) {
        errors.push('Flag trigger requires at least one flag');
      }
    }
    
    // Validate choices
    if (formToValidate.choices.length === 0) {
      errors.push('At least one choice is required');
    }
    
    formToValidate.choices.forEach((choice, index) => {
      if (!choice.text.trim()) {
        errors.push(`Choice ${index + 1}: Text is required`);
      }
    });
    
    return errors;
  };

  const createNewStorylet = () => {
    const errors = validateStoryletForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    const newStorylet: Storylet = {
      id: newStoryletForm.id,
      name: newStoryletForm.name,
      description: newStoryletForm.description,
      trigger: {
        type: newStoryletForm.triggerType,
        conditions: newStoryletForm.triggerConditions
      },
      choices: newStoryletForm.choices.map(choice => ({
        id: choice.id,
        text: choice.text,
        effects: choice.effects,
        ...(choice.nextStoryletId && { nextStoryletId: choice.nextStoryletId })
      }))
    };
    
    // Add to storylet store
    try {
      addStorylet(newStorylet);
      
      console.log('🆕 New Storylet Created:', newStorylet);
      console.log('📝 To permanently add this storylet, add it to src/data/sampleStorylets.ts');
      
      alert(`Storylet "${newStorylet.name}" created successfully! It's now available in the system.`);
      
      // Reset form
      setNewStoryletForm({
        id: '',
        name: '',
        description: '',
        triggerType: 'time',
        triggerConditions: {},
        choices: [{
          id: 'choice_1',
          text: '',
          effects: [],
          nextStoryletId: ''
        }]
      });
      setValidationErrors([]);
      setActiveTab('all');
      
    } catch (error) {
      console.error('Failed to create storylet:', error);
      alert('Failed to create storylet. Check console for details.');
    }
  };

  const addChoice = () => {
    const newChoice = {
      id: `choice_${newStoryletForm.choices.length + 1}`,
      text: '',
      effects: [],
      nextStoryletId: ''
    };
    setNewStoryletForm({
      ...newStoryletForm,
      choices: [...newStoryletForm.choices, newChoice]
    });
  };

  const removeChoice = (index: number) => {
    if (newStoryletForm.choices.length > 1) {
      const newChoices = newStoryletForm.choices.filter((_, i) => i !== index);
      setNewStoryletForm({
        ...newStoryletForm,
        choices: newChoices
      });
    }
  };

  const updateChoice = (index: number, field: string, value: any) => {
    const newChoices = [...newStoryletForm.choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setNewStoryletForm({
      ...newStoryletForm,
      choices: newChoices
    });
  };

  const addEffectToChoice = (choiceIndex: number) => {
    const newEffect = { type: 'resource', key: 'energy', delta: 0 };
    const newChoices = [...newStoryletForm.choices];
    newChoices[choiceIndex].effects.push(newEffect);
    setNewStoryletForm({
      ...newStoryletForm,
      choices: newChoices
    });
  };

  const removeEffectFromChoice = (choiceIndex: number, effectIndex: number) => {
    const newChoices = [...newStoryletForm.choices];
    newChoices[choiceIndex].effects.splice(effectIndex, 1);
    setNewStoryletForm({
      ...newStoryletForm,
      choices: newChoices
    });
  };

  const updateEffect = (choiceIndex: number, effectIndex: number, field: string, value: any) => {
    const newChoices = [...newStoryletForm.choices];
    newChoices[choiceIndex].effects[effectIndex][field] = value;
    setNewStoryletForm({
      ...newStoryletForm,
      choices: newChoices
    });
  };

  const renderStoryletCard = (storylet: Storylet, showEvaluation = false) => {
    const evaluation = showEvaluation ? evaluateTrigger(storylet) : null;
    const isActive = activeStoryletIds.includes(storylet.id);
    const isCompleted = completedStoryletIds.includes(storylet.id);
    
    return (
      <Card 
        key={storylet.id} 
        className={`border cursor-pointer transition-all ${
          selectedStorylet?.id === storylet.id 
            ? 'border-blue-500 bg-blue-50' 
            : isActive 
              ? 'border-green-500 bg-green-50'
              : isCompleted
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedStorylet(storylet)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-gray-900">{storylet.name}</h4>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getTriggerColor(storylet.trigger)}`}>
              {storylet.trigger.type}
            </span>
            {isActive && <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">ACTIVE</span>}
            {isCompleted && <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">COMPLETED</span>}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{storylet.description}</p>
        
        <div className="text-xs text-gray-500">
          <div><strong>ID:</strong> {storylet.id}</div>
          <div><strong>Trigger:</strong> {JSON.stringify(storylet.trigger.conditions)}</div>
          <div><strong>Choices:</strong> {storylet.choices.length}</div>
          
          {evaluation && (
            <div className={`mt-2 p-2 rounded ${evaluation.canTrigger ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Can Trigger:</strong> {evaluation.canTrigger ? 'YES' : 'NO'}
              <br />
              <strong>Reason:</strong> {evaluation.reason}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              forceUnlockStorylet(storylet.id);
            }}
            disabled={isActive}
          >
            Force Unlock
          </Button>
          <Button 
            size="sm" 
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              startEditingStorylet(storylet);
            }}
          >
            ✏️ Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              exportStoryletJSON(storylet);
            }}
          >
            📋 JSON
          </Button>
          {evaluation && !evaluation.canTrigger && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                // Helper to meet trigger conditions
                if (storylet.trigger.type === 'time' && storylet.trigger.conditions.day) {
                  // This would need to be implemented in the store
                  console.log(`Need to advance to day ${storylet.trigger.conditions.day}`);
                }
              }}
            >
              Meet Conditions
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const renderAllStorylets = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Object.values(allStorylets).map(storylet => renderStoryletCard(storylet, true))}
    </div>
  );

  const renderActiveStorylets = () => (
    <div className="space-y-4">
      {activeStoryletIds.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No active storylets</p>
          <Button onClick={evaluateStorylets} variant="primary">
            Force Evaluation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeStoryletIds.map(id => renderStoryletCard(allStorylets[id]))}
        </div>
      )}
    </div>
  );

  const renderCompletedStorylets = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {completedStoryletIds.map(id => renderStoryletCard(allStorylets[id]))}
    </div>
  );

  const renderDebugPanel = () => (
    <div className="space-y-6">
      <Card title="System State">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold mb-2">Game State</h5>
            <div className="text-sm space-y-1">
              <div><strong>Current Day:</strong> {debugInfo?.currentDay}</div>
              <div><strong>Active Storylets:</strong> {debugInfo?.activeStoryletIds?.length || 0}</div>
              <div><strong>Completed Storylets:</strong> {debugInfo?.completedStoryletIds?.length || 0}</div>
              <div><strong>Active Flags:</strong> {Object.keys(debugInfo?.activeFlags || {}).length}</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold mb-2">Resources</h5>
            <div className="text-sm space-y-1">
              {debugInfo?.resources && Object.entries(debugInfo.resources).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span><strong>{key}:</strong> {value as string}</span>
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateResource(key as keyof typeof resources, Math.min(100, (resources[key as keyof typeof resources] as number) + 10))}
                      className="px-2 py-0 text-xs"
                    >
                      +10
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateResource(key as keyof typeof resources, Math.max(0, (resources[key as keyof typeof resources] as number) - 10))}
                      className="px-2 py-0 text-xs"
                    >
                      -10
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Active Flags">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(debugInfo?.activeFlags || {}).map(([flag, value]) => (
            <div key={flag} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">{flag}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {value ? 'TRUE' : 'FALSE'}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setFlag(flag, !value)}
                  className="px-2 py-0 text-xs"
                >
                  Toggle
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Debug Actions">
        <div className="flex flex-wrap gap-3">
          <Button onClick={evaluateStorylets} variant="primary">
            Force Evaluate Storylets
          </Button>
          <Button onClick={resetStorylets} variant="outline">
            Reset All Storylets
          </Button>
          <Button 
            onClick={() => {
              // Force unlock the midterm storylet for testing
              forceUnlockStorylet('midterm_mastery_1');
            }}
            variant="primary"
          >
            Unlock Midterm Storylet
          </Button>
          <Button 
            onClick={() => {
              // Set flag for testing
              setFlag('test_flag', true);
            }}
            variant="outline"
          >
            Set Test Flag
          </Button>
        </div>
      </Card>

      <Card title="Raw Debug Data">
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </Card>
    </div>
  );

  const renderCreateNewStorylet = () => (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="text-red-800">
            <h5 className="font-semibold mb-2">Validation Errors:</h5>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storylet ID *</label>
            <input
              type="text"
              value={newStoryletForm.id}
              onChange={(e) => setNewStoryletForm({ ...newStoryletForm, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., my_custom_storylet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={newStoryletForm.name}
              onChange={(e) => setNewStoryletForm({ ...newStoryletForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Display name for storylet"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={newStoryletForm.description}
            onChange={(e) => setNewStoryletForm({ ...newStoryletForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="What happens in this storylet?"
          />
        </div>
      </Card>

      {/* Trigger Conditions */}
      <Card title="Trigger Conditions">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
            <select
              value={newStoryletForm.triggerType}
              onChange={(e) => {
                const type = e.target.value as 'time' | 'resource' | 'flag';
                setNewStoryletForm({ 
                  ...newStoryletForm, 
                  triggerType: type,
                  triggerConditions: type === 'time' ? { day: 1 } : type === 'flag' ? { flags: [] } : {}
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">Time-based (specific day)</option>
              <option value="resource">Resource-based (energy, stress, etc.)</option>
              <option value="flag">Flag-based (story flags)</option>
            </select>
          </div>

          {/* Time-based conditions */}
          {newStoryletForm.triggerType === 'time' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Day</label>
              <input
                type="number"
                min="1"
                value={newStoryletForm.triggerConditions.day || 1}
                onChange={(e) => setNewStoryletForm({
                  ...newStoryletForm,
                  triggerConditions: { day: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Resource-based conditions */}
          {newStoryletForm.triggerType === 'resource' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource Conditions (JSON)</label>
              <textarea
                value={JSON.stringify(newStoryletForm.triggerConditions, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setNewStoryletForm({ ...newStoryletForm, triggerConditions: parsed });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={4}
                placeholder='{"energy": {"max": 25}, "stress": {"min": 75}}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: {`{"energy": {"max": 25}, "stress": {"min": 75}}`}
              </p>
            </div>
          )}

          {/* Flag-based conditions */}
          {newStoryletForm.triggerType === 'flag' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Flags (comma-separated)</label>
              <input
                type="text"
                value={(newStoryletForm.triggerConditions.flags || []).join(', ')}
                onChange={(e) => setNewStoryletForm({
                  ...newStoryletForm,
                  triggerConditions: { 
                    flags: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., flag1, flag2, flag3"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Choices */}
      <Card title="Choices">
        <div className="space-y-4">
          {newStoryletForm.choices.map((choice, choiceIndex) => (
            <div key={choiceIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-semibold">Choice {choiceIndex + 1}</h5>
                {newStoryletForm.choices.length > 1 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => removeChoice(choiceIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Choice ID</label>
                  <input
                    type="text"
                    value={choice.id}
                    onChange={(e) => updateChoice(choiceIndex, 'id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Storylet ID (optional)</label>
                  <input
                    type="text"
                    value={choice.nextStoryletId || ''}
                    onChange={(e) => updateChoice(choiceIndex, 'nextStoryletId', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Link to another storylet"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Choice Text *</label>
                <textarea
                  value={choice.text}
                  onChange={(e) => updateChoice(choiceIndex, 'text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="What does this choice say?"
                />
              </div>

              {/* Effects */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h6 className="font-medium">Effects</h6>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addEffectToChoice(choiceIndex)}
                  >
                    Add Effect
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {choice.effects.map((effect, effectIndex) => (
                    <div key={effectIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <select
                        value={effect.type}
                        onChange={(e) => updateEffect(choiceIndex, effectIndex, 'type', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="resource">Resource</option>
                        <option value="skillXp">Skill XP</option>
                        <option value="flag">Flag</option>
                        <option value="unlock">Unlock Storylet</option>
                        <option value="minigame">Minigame</option>
                      </select>
                      
                      {effect.type === 'resource' && (
                        <>
                          <select
                            value={effect.key}
                            onChange={(e) => updateEffect(choiceIndex, effectIndex, 'key', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="energy">Energy</option>
                            <option value="stress">Stress</option>
                            <option value="money">Money</option>
                            <option value="knowledge">Knowledge</option>
                            <option value="social">Social</option>
                          </select>
                          <input
                            type="number"
                            value={effect.delta || 0}
                            onChange={(e) => updateEffect(choiceIndex, effectIndex, 'delta', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                            placeholder="±10"
                          />
                        </>
                      )}
                      
                      {effect.type === 'skillXp' && (
                        <>
                          <select
                            value={effect.key}
                            onChange={(e) => updateEffect(choiceIndex, effectIndex, 'key', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="observation">Observation</option>
                            <option value="deception">Deception</option>
                            <option value="subterfuge">Subterfuge</option>
                            <option value="persuasion">Persuasion</option>
                            <option value="research">Research</option>
                            <option value="technology">Technology</option>
                          </select>
                          <input
                            type="number"
                            value={effect.amount || 0}
                            onChange={(e) => updateEffect(choiceIndex, effectIndex, 'amount', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                            placeholder="XP"
                          />
                        </>
                      )}
                      
                      {effect.type === 'flag' && (
                        <>
                          <input
                            type="text"
                            value={effect.key || ''}
                            onChange={(e) => updateEffect(choiceIndex, effectIndex, 'key', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                            placeholder="Flag name"
                          />
                          <select
                            value={effect.value ? 'true' : 'false'}
                            onChange={(e) => updateEffect(choiceIndex, effectIndex, 'value', e.target.value === 'true')}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        </>
                      )}

                      {effect.type === 'unlock' && (
                        <input
                          type="text"
                          value={effect.storyletId || ''}
                          onChange={(e) => updateEffect(choiceIndex, effectIndex, 'storyletId', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                          placeholder="Storylet ID to unlock"
                        />
                      )}

                      {effect.type === 'minigame' && (
                        <select
                          value={effect.gameId || ''}
                          onChange={(e) => updateEffect(choiceIndex, effectIndex, 'gameId', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                        >
                          <option value="">Select a minigame...</option>
                          <option value="memory-cards">Memory Cards</option>
                          <option value="pattern-sequence">Pattern Sequence</option>
                          <option value="math-quiz">Math Quiz</option>
                          <option value="reaction-time">Reaction Time</option>
                          <option value="word-scramble">Word Scramble</option>
                          <option value="logic-puzzle">Logic Puzzle</option>
                          <option value="typing-test">Typing Test</option>
                          <option value="color-match">Color Match</option>
                        </select>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeEffectFromChoice(choiceIndex, effectIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addChoice} variant="outline">
            Add Another Choice
          </Button>
        </div>
      </Card>

      {/* Create Button */}
      <div className="flex justify-between items-center">
        <Button 
          onClick={() => {
            setNewStoryletForm({
              id: '',
              name: '',
              description: '',
              triggerType: 'time',
              triggerConditions: {},
              choices: [{ id: 'choice_1', text: '', effects: [], nextStoryletId: '' }]
            });
            setValidationErrors([]);
          }}
          variant="outline"
        >
          Clear Form
        </Button>
        
        <Button 
          onClick={createNewStorylet}
          variant="primary"
          disabled={validationErrors.length > 0}
        >
          Create Storylet
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Developer Storylet Management Panel</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>This panel allows you to view, debug, and manage all storylets in the system. Use the tabs to explore different views and the debug panel to troubleshoot trigger conditions.</p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <Button 
              onClick={() => {
                if (window.confirm('⚠️ This will completely reset the game!\n\n• Remove all characters\n• Reset all skills and XP to 0\n• Clear all storylet progress\n• Reset resources and day counter\n• Clear all quests and goals\n\nAre you sure you want to continue?')) {
                  resetGame();
                }
              }}
              variant="outline"
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              🔄 Reset Game
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'all' && renderAllStorylets()}
        {activeTab === 'active' && renderActiveStorylets()}
        {activeTab === 'completed' && renderCompletedStorylets()}
        {activeTab === 'debug' && renderDebugPanel()}
        {activeTab === 'create' && renderCreateNewStorylet()}
        {activeTab === 'edit' && (
          <div className="space-y-6">
            {editForm && editingStorylet ? (
              <div className="space-y-6">
                {/* Warning Banner */}
                <Card className="border-orange-200 bg-orange-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-orange-800">Important: Changes Are Temporary</h3>
                      <div className="mt-1 text-sm text-orange-700">
                        <p>Edits only affect the current session. To make changes permanent:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Save your changes (JSON will be copied to clipboard)</li>
                          <li>Open the appropriate data file in <code className="bg-orange-100 px-1 rounded">src/data/</code></li>
                          <li>Replace or add the storylet using the copied JSON</li>
                          <li>Save the file to make changes permanent</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Header */}
                <Card className="border-blue-200 bg-blue-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Editing Storylet</h3>
                      <p className="text-blue-600">Original ID: {editingStorylet.id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={cancelEditing} variant="outline">
                        Cancel
                      </Button>
                      <Button onClick={saveEditedStorylet} variant="primary">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </Card>
        
                {/* Use the same form as create, but for editing */}
                {validationErrors.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <div className="text-red-800">
                      <h5 className="font-semibold mb-2">Validation Errors:</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
        
                {/* Basic Information */}
                <Card title="Basic Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Storylet ID *</label>
                      <input
                        type="text"
                        value={editForm.id}
                        onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., my_custom_storylet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Display name for storylet"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="What happens in this storylet?"
                    />
                  </div>
                </Card>
        
                {/* Trigger Conditions */}
                <Card title="Trigger Conditions">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                      <select
                        value={editForm.triggerType}
                        onChange={(e) => {
                          const type = e.target.value as 'time' | 'resource' | 'flag';
                          setEditForm({ 
                            ...editForm, 
                            triggerType: type,
                            triggerConditions: type === 'time' ? { day: 1 } : type === 'flag' ? { flags: [] } : {}
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="time">Time-based (specific day)</option>
                        <option value="resource">Resource-based (energy, stress, etc.)</option>
                        <option value="flag">Flag-based (story flags)</option>
                      </select>
                    </div>
        
                    {/* Time-based conditions */}
                    {editForm.triggerType === 'time' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Day</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.triggerConditions.day || 1}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            triggerConditions: { day: parseInt(e.target.value) || 1 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
        
                    {/* Resource-based conditions */}
                    {editForm.triggerType === 'resource' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Conditions (JSON)</label>
                        <textarea
                          value={JSON.stringify(editForm.triggerConditions, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setEditForm({ ...editForm, triggerConditions: parsed });
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          rows={4}
                          placeholder='{"energy": {"max": 25}, "stress": {"min": 75}}'
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example: {`{"energy": {"max": 25}, "stress": {"min": 75}}`}
                        </p>
                      </div>
                    )}
        
                    {/* Flag-based conditions */}
                    {editForm.triggerType === 'flag' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Required Flags (comma-separated)</label>
                        <input
                          type="text"
                          value={(editForm.triggerConditions.flags || []).join(', ')}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            triggerConditions: { 
                              flags: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., flag1, flag2, flag3"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Choices for Edit */}
                <Card title="Choices">
                  <div className="space-y-4">
                    {editForm.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold">Choice {choiceIndex + 1}</h5>
                          {editForm.choices.length > 1 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newChoices = editForm.choices.filter((_, i) => i !== choiceIndex);
                                setEditForm({ ...editForm, choices: newChoices });
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Choice ID</label>
                            <input
                              type="text"
                              value={choice.id}
                              onChange={(e) => {
                                const newChoices = [...editForm.choices];
                                newChoices[choiceIndex] = { ...newChoices[choiceIndex], id: e.target.value };
                                setEditForm({ ...editForm, choices: newChoices });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Next Storylet ID (optional)</label>
                            <input
                              type="text"
                              value={choice.nextStoryletId || ''}
                              onChange={(e) => {
                                const newChoices = [...editForm.choices];
                                newChoices[choiceIndex] = { ...newChoices[choiceIndex], nextStoryletId: e.target.value || undefined };
                                setEditForm({ ...editForm, choices: newChoices });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Link to another storylet"
                            />
                          </div>
                        </div>
        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Choice Text *</label>
                          <textarea
                            value={choice.text}
                            onChange={(e) => {
                              const newChoices = [...editForm.choices];
                              newChoices[choiceIndex] = { ...newChoices[choiceIndex], text: e.target.value };
                              setEditForm({ ...editForm, choices: newChoices });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="What does this choice say?"
                          />
                        </div>
        
                        {/* Effects for Edit */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="font-medium">Effects</h6>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newChoices = [...editForm.choices];
                                const newEffect = { type: 'resource', key: 'energy', delta: 0 };
                                newChoices[choiceIndex].effects.push(newEffect);
                                setEditForm({ ...editForm, choices: newChoices });
                              }}
                            >
                              Add Effect
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {choice.effects.map((effect, effectIndex) => (
                              <div key={effectIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                <select
                                  value={effect.type}
                                  onChange={(e) => {
                                    const newChoices = [...editForm.choices];
                                    newChoices[choiceIndex].effects[effectIndex].type = e.target.value;
                                    setEditForm({ ...editForm, choices: newChoices });
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="resource">Resource</option>
                                  <option value="skillXp">Skill XP</option>
                                  <option value="flag">Flag</option>
                                  <option value="unlock">Unlock Storylet</option>
                                  <option value="minigame">Minigame</option>
                                </select>
                                
                                {effect.type === 'resource' && (
                                  <>
                                    <select
                                      value={effect.key}
                                      onChange={(e) => {
                                        const newChoices = [...editForm.choices];
                                        newChoices[choiceIndex].effects[effectIndex].key = e.target.value;
                                        setEditForm({ ...editForm, choices: newChoices });
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="energy">Energy</option>
                                      <option value="stress">Stress</option>
                                      <option value="money">Money</option>
                                      <option value="knowledge">Knowledge</option>
                                      <option value="social">Social</option>
                                    </select>
                                    <input
                                      type="number"
                                      value={effect.delta || 0}
                                      onChange={(e) => {
                                        const newChoices = [...editForm.choices];
                                        newChoices[choiceIndex].effects[effectIndex].delta = parseInt(e.target.value) || 0;
                                        setEditForm({ ...editForm, choices: newChoices });
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                                      placeholder="±10"
                                    />
                                  </>
                                )}
                                
                                {effect.type === 'skillXp' && (
                                  <>
                                    <select
                                      value={effect.key}
                                      onChange={(e) => {
                                        const newChoices = [...editForm.choices];
                                        newChoices[choiceIndex].effects[effectIndex].key = e.target.value;
                                        setEditForm({ ...editForm, choices: newChoices });
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="observation">Observation</option>
                                      <option value="deception">Deception</option>
                                      <option value="subterfuge">Subterfuge</option>
                                      <option value="persuasion">Persuasion</option>
                                      <option value="research">Research</option>
                                      <option value="technology">Technology</option>
                                    </select>
                                    <input
                                      type="number"
                                      value={effect.amount || 0}
                                      onChange={(e) => {
                                        const newChoices = [...editForm.choices];
                                        newChoices[choiceIndex].effects[effectIndex].amount = parseInt(e.target.value) || 0;
                                        setEditForm({ ...editForm, choices: newChoices });
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                                      placeholder="XP"
                                    />
                                  </>
                                )}
                                
                                {effect.type === 'flag' && (
                                  <>
                                    <input
                                      type="text"
                                      value={effect.key || ''}
                                      onChange={(e) => {
                                        const newChoices = [...editForm.choices];
                                        newChoices[choiceIndex].effects[effectIndex].key = e.target.value;
                                        setEditForm({ ...editForm, choices: newChoices });
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                                      placeholder="Flag name"
                                    />
                                    <select
                                      value={effect.value ? 'true' : 'false'}
                                      onChange={(e) => {
                                        const newChoices = [...editForm.choices];
                                        newChoices[choiceIndex].effects[effectIndex].value = e.target.value === 'true';
                                        setEditForm({ ...editForm, choices: newChoices });
                                      }}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="true">True</option>
                                      <option value="false">False</option>
                                    </select>
                                  </>
                                )}

                                {effect.type === 'unlock' && (
                                  <input
                                    type="text"
                                    value={effect.storyletId || ''}
                                    onChange={(e) => {
                                      const newChoices = [...editForm.choices];
                                      newChoices[choiceIndex].effects[effectIndex].storyletId = e.target.value;
                                      setEditForm({ ...editForm, choices: newChoices });
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                                    placeholder="Storylet ID to unlock"
                                  />
                                )}

                                {effect.type === 'minigame' && (
                                  <select
                                    value={effect.gameId || ''}
                                    onChange={(e) => {
                                      const newChoices = [...editForm.choices];
                                      newChoices[choiceIndex].effects[effectIndex].gameId = e.target.value;
                                      setEditForm({ ...editForm, choices: newChoices });
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                                  >
                                    <option value="">Select a minigame...</option>
                                    <option value="memory-cards">Memory Cards</option>
                                    <option value="pattern-sequence">Pattern Sequence</option>
                                    <option value="math-quiz">Math Quiz</option>
                                    <option value="reaction-time">Reaction Time</option>
                                    <option value="word-scramble">Word Scramble</option>
                                    <option value="logic-puzzle">Logic Puzzle</option>
                                    <option value="typing-test">Typing Test</option>
                                    <option value="color-match">Color Match</option>
                                  </select>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    const newChoices = [...editForm.choices];
                                    newChoices[choiceIndex].effects.splice(effectIndex, 1);
                                    setEditForm({ ...editForm, choices: newChoices });
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      onClick={() => {
                        const newChoice = {
                          id: `choice_${editForm.choices.length + 1}`,
                          text: '',
                          effects: [],
                          nextStoryletId: ''
                        };
                        setEditForm({ ...editForm, choices: [...editForm.choices, newChoice] });
                      }}
                      variant="outline"
                    >
                      Add Another Choice
                    </Button>
                  </div>
                </Card>
        
                {/* Save/Cancel Buttons */}
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={cancelEditing}
                    variant="outline"
                  >
                    Cancel Changes
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        if (editForm && editingStorylet) {
                          setEditForm(storyletToForm(editingStorylet));
                          setValidationErrors([]);
                        }
                      }}
                      variant="outline"
                    >
                      Reset to Original
                    </Button>
                    <Button 
                      onClick={saveEditedStorylet}
                      variant="primary"
                      disabled={validationErrors.length > 0}
                    >
                      Save Storylet
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No storylet selected for editing</p>
                <Button onClick={() => setActiveTab('all')} variant="primary">
                  Go Back to All Storylets
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Storylet Detail */}
      {selectedStorylet && (
        <Card title={`Storylet Details: ${selectedStorylet.name}`} className="mt-6">
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Description</h5>
              <p className="text-gray-700">{selectedStorylet.description}</p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Trigger Conditions</h5>
              <div className="bg-gray-100 p-3 rounded">
                <div><strong>Type:</strong> {selectedStorylet.trigger.type}</div>
                <div><strong>Conditions:</strong> {JSON.stringify(selectedStorylet.trigger.conditions, null, 2)}</div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-2">Choices ({selectedStorylet.choices.length})</h5>
              <div className="space-y-3">
                {selectedStorylet.choices.map((choice, index) => (
                  <div key={choice.id} className="border rounded p-3">
                    <h6 className="font-medium">{choice.text}</h6>
                    <div className="text-sm text-gray-600 mt-2">
                      <div><strong>Effects:</strong></div>
                      <ul className="list-disc list-inside ml-2">
                        {choice.effects.map((effect, effectIndex) => (
                          <li key={effectIndex}>
                            {effect.type}: {JSON.stringify(effect)}
                          </li>
                        ))}
                      </ul>
                      {choice.nextStoryletId && (
                        <div className="mt-2"><strong>Next Storylet:</strong> {choice.nextStoryletId}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StoryletManagementPanel;