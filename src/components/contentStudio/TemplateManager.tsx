// /Users/montysharma/V11M2/src/components/contentStudio/TemplateManager.tsx

import React, { useState, useEffect } from 'react';
import { UndoRedoAction } from '../../hooks/useUndoRedo';
import HelpTooltip from '../ui/HelpTooltip';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface StoryletTemplate {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'social' | 'challenge' | 'minigame' | 'narrative' | 'custom';
  icon: string;
  template: {
    title: string;
    content: string;
    triggers: any[];
    effects: any[];
    choices: any[];
    tags: string[];
    weight: number;
    cooldown: number;
    maxActivations: number;
  };
  isBuiltIn: boolean;
  createdAt: string;
  usageCount: number;
}

interface TemplateManagerProps {
  undoRedoSystem: UndoRedoSystem;
  onUseTemplate?: (template: StoryletTemplate) => void;
}

const builtInTemplates: StoryletTemplate[] = [
  {
    id: 'academic_exam',
    name: 'Academic Exam',
    description: 'High-stakes exam with skill checks and stress management',
    category: 'academic',
    icon: '📝',
    template: {
      title: 'Midterm Examination',
      content: 'The midterm exam is approaching. You need to decide how to prepare and manage your stress levels.',
      triggers: [
        { type: 'time', operator: 'equals', key: 'week', value: 8 },
        { type: 'resource', operator: 'greater_than', key: 'knowledge', value: 30 }
      ],
      effects: [
        { type: 'resource', target: 'stress', operation: 'add', value: 15 }
      ],
      choices: [
        {
          text: 'Study intensively (High stress, high reward)',
          effects: [
            { type: 'resource', target: 'knowledge', operation: 'add', value: 20 },
            { type: 'resource', target: 'stress', operation: 'add', value: 25 },
            { type: 'resource', target: 'energy', operation: 'subtract', value: 30 }
          ],
          skillCheck: {
            skill: 'focus',
            difficulty: 70,
            successEffects: [{ type: 'skill', target: 'academic', operation: 'add', value: 15 }],
            failureEffects: [{ type: 'resource', target: 'stress', operation: 'add', value: 20 }]
          }
        },
        {
          text: 'Balanced preparation',
          effects: [
            { type: 'resource', target: 'knowledge', operation: 'add', value: 10 },
            { type: 'resource', target: 'stress', operation: 'add', value: 10 },
            { type: 'resource', target: 'energy', operation: 'subtract', value: 15 }
          ]
        },
        {
          text: 'Minimal study (Low stress, risky)',
          effects: [
            { type: 'resource', target: 'knowledge', operation: 'add', value: 5 },
            { type: 'resource', target: 'stress', operation: 'add', value: 5 },
            { type: 'resource', target: 'energy', operation: 'subtract', value: 5 }
          ]
        }
      ],
      tags: ['academic', 'exam', 'stress', 'skill_check'],
      weight: 3,
      cooldown: 14,
      maxActivations: 3
    },
    isBuiltIn: true,
    createdAt: '2024-01-01',
    usageCount: 0
  },
  {
    id: 'social_party',
    name: 'Campus Party',
    description: 'Social event with relationship building and energy management',
    category: 'social',
    icon: '🎉',
    template: {
      title: 'Weekend Campus Party',
      content: 'There\'s a party happening in the dorms this weekend. It could be a great opportunity to socialize, but you need to consider your energy and academic commitments.',
      triggers: [
        { type: 'time', operator: 'greater_than', key: 'day', value: 14 },
        { type: 'resource', operator: 'greater_than', key: 'social', value: 20 }
      ],
      effects: [],
      choices: [
        {
          text: 'Party hard all night',
          effects: [
            { type: 'resource', target: 'social', operation: 'add', value: 25 },
            { type: 'resource', target: 'energy', operation: 'subtract', value: 40 },
            { type: 'resource', target: 'stress', operation: 'subtract', value: 15 }
          ]
        },
        {
          text: 'Attend briefly and leave early',
          effects: [
            { type: 'resource', target: 'social', operation: 'add', value: 10 },
            { type: 'resource', target: 'energy', operation: 'subtract', value: 15 },
            { type: 'resource', target: 'stress', operation: 'subtract', value: 5 }
          ]
        },
        {
          text: 'Skip the party to rest',
          effects: [
            { type: 'resource', target: 'energy', operation: 'add', value: 20 },
            { type: 'resource', target: 'social', operation: 'subtract', value: 5 }
          ]
        }
      ],
      tags: ['social', 'party', 'energy', 'relationships'],
      weight: 2,
      cooldown: 7,
      maxActivations: 10
    },
    isBuiltIn: true,
    createdAt: '2024-01-01',
    usageCount: 0
  },
  {
    id: 'minigame_navigation',
    name: 'Campus Navigation Challenge',
    description: 'Path-finding minigame with skill development',
    category: 'minigame',
    icon: '🗺️',
    template: {
      title: 'Lost on Campus',
      content: 'You\'re trying to find a new building on campus for an important meeting. The campus map is confusing and you\'re running late.',
      triggers: [
        { type: 'time', operator: 'greater_than', key: 'day', value: 3 },
        { type: 'random', operator: 'less_than', key: 'chance', value: 0.3 }
      ],
      effects: [
        { type: 'minigame', target: 'path_planner', operation: 'trigger', value: { difficulty: 'medium', timeLimit: 120 } }
      ],
      choices: [
        {
          text: 'Use the navigation minigame',
          effects: [
            { type: 'minigame', target: 'path_planner', operation: 'trigger', value: { variant: 'campus_navigation' } }
          ]
        },
        {
          text: 'Ask for directions',
          effects: [
            { type: 'resource', target: 'social', operation: 'add', value: 5 },
            { type: 'skill', target: 'communication', operation: 'add', value: 2 }
          ]
        },
        {
          text: 'Wing it and hope for the best',
          effects: [
            { type: 'resource', target: 'stress', operation: 'add', value: 10 }
          ],
          skillCheck: {
            skill: 'navigation',
            difficulty: 60,
            successEffects: [{ type: 'skill', target: 'navigation', operation: 'add', value: 5 }],
            failureEffects: [{ type: 'resource', target: 'stress', operation: 'add', value: 20 }]
          }
        }
      ],
      tags: ['minigame', 'navigation', 'skill_development'],
      weight: 1,
      cooldown: 3,
      maxActivations: 5
    },
    isBuiltIn: true,
    createdAt: '2024-01-01',
    usageCount: 0
  }
];

const categories = [
  { value: 'academic', label: 'Academic', icon: '📚', color: 'blue' },
  { value: 'social', label: 'Social', icon: '👥', color: 'green' },
  { value: 'challenge', label: 'Challenge', icon: '💪', color: 'orange' },
  { value: 'minigame', label: 'Minigame', icon: '🎮', color: 'purple' },
  { value: 'narrative', label: 'Narrative', icon: '📖', color: 'indigo' },
  { value: 'custom', label: 'Custom', icon: '⚙️', color: 'gray' }
];

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  undoRedoSystem, 
  onUseTemplate 
}) => {
  const [templates, setTemplates] = useState<StoryletTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StoryletTemplate | null>(null);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('storylet_templates');
    const customTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
    setTemplates([...builtInTemplates, ...customTemplates]);
  }, []);

  // Save custom templates to localStorage
  const saveTemplates = (newTemplates: StoryletTemplate[]) => {
    const customTemplates = newTemplates.filter(t => !t.isBuiltIn);
    localStorage.setItem('storylet_templates', JSON.stringify(customTemplates));
    setTemplates(newTemplates);
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Create new template
  const createTemplate = () => {
    const newTemplate: StoryletTemplate = {
      id: `custom_${Date.now()}`,
      name: 'New Template',
      description: 'Template description',
      category: 'custom',
      icon: '📝',
      template: {
        title: 'New Storylet',
        content: 'Storylet content...',
        triggers: [],
        effects: [],
        choices: [],
        tags: [],
        weight: 1,
        cooldown: 0,
        maxActivations: 1
      },
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  // Save template
  const saveTemplate = (template: StoryletTemplate) => {
    const existingTemplate = templates.find(t => t.id === template.id);
    const isEdit = !!existingTemplate;
    
    const undoRedoAction: UndoRedoAction = {
      id: `save_template_${Date.now()}`,
      description: `${isEdit ? 'Edit' : 'Create'} template "${template.name}"`,
      timestamp: new Date(),
      redoAction: () => {
        const newTemplates = isEdit
          ? templates.map(t => t.id === template.id ? template : t)
          : [...templates, template];
        saveTemplates(newTemplates);
        console.log('✅ Template saved:', template.name);
      },
      undoAction: () => {
        if (isEdit && existingTemplate) {
          // Restore previous version
          const newTemplates = templates.map(t => t.id === template.id ? existingTemplate : t);
          saveTemplates(newTemplates);
          console.log('↶ Template edit undone:', template.name);
        } else {
          // Remove newly created template
          const newTemplates = templates.filter(t => t.id !== template.id);
          saveTemplates(newTemplates);
          console.log('↶ Template creation undone:', template.name);
        }
      },
      data: { template, previousTemplate: existingTemplate }
    };

    undoRedoSystem.executeAction(undoRedoAction);
    setEditingTemplate(null);
    setIsCreating(false);
  };

  // Delete template
  const deleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || template.isBuiltIn) return;

    const undoRedoAction: UndoRedoAction = {
      id: `delete_template_${Date.now()}`,
      description: `Delete template "${template.name}"`,
      timestamp: new Date(),
      redoAction: () => {
        const newTemplates = templates.filter(t => t.id !== templateId);
        saveTemplates(newTemplates);
        console.log('✅ Template deleted:', template.name);
      },
      undoAction: () => {
        const newTemplates = [...templates, template];
        saveTemplates(newTemplates);
        console.log('↶ Template deletion undone:', template.name);
      },
      data: { template }
    };

    undoRedoSystem.executeAction(undoRedoAction);
  };

  // Use template
  const useTemplate = (template: StoryletTemplate) => {
    const previousUsageCount = template.usageCount;
    const updatedTemplate = {
      ...template,
      usageCount: template.usageCount + 1
    };
    
    const undoRedoAction: UndoRedoAction = {
      id: `use_template_${Date.now()}`,
      description: `Use template "${template.name}"`,
      timestamp: new Date(),
      redoAction: () => {
        const newTemplates = templates.map(t => 
          t.id === template.id ? updatedTemplate : t
        );
        saveTemplates(newTemplates);
        console.log('✅ Template used:', template.name);
      },
      undoAction: () => {
        const revertedTemplate = { ...updatedTemplate, usageCount: previousUsageCount };
        const newTemplates = templates.map(t => 
          t.id === template.id ? revertedTemplate : t
        );
        saveTemplates(newTemplates);
        console.log('↶ Template usage undone:', template.name);
      },
      data: { template, previousUsageCount }
    };

    undoRedoSystem.executeAction(undoRedoAction);
    
    if (onUseTemplate) {
      onUseTemplate(updatedTemplate);
    }
  };

  // Get category config
  const getCategoryConfig = (category: string) => {
    return categories.find(c => c.value === category) || categories[categories.length - 1];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Template Manager</h3>
            <p className="text-sm text-gray-600">Create, manage, and use storylet templates</p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTooltip content="Templates help you quickly create similar storylets. Use built-in templates or create your own custom ones." />
            <button
              onClick={createTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const categoryConfig = getCategoryConfig(template.category);
            return (
              <div
                key={template.id}
                className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow border-${categoryConfig.color}-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-800 truncate">{template.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded bg-${categoryConfig.color}-100 text-${categoryConfig.color}-700`}>
                        {categoryConfig.icon} {categoryConfig.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {!template.isBuiltIn && (
                      <>
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                          title="Edit template"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                          title="Delete template"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Used {template.usageCount} times</span>
                  <span>{template.isBuiltIn ? 'Built-in' : 'Custom'}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => useTemplate(template)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    View
                  </button>
                </div>
                
                {/* Template Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.template.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.template.tags.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      +{template.template.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="text-lg font-medium mb-2">No templates found</h4>
            <p className="text-sm">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or category filter'
                : 'Create your first template to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">
                  {isCreating ? 'Create Template' : 'Edit Template'}
                </h4>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsCreating(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editingTemplate.category}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value as any } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <input
                    type="text"
                    value={editingTemplate.icon}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, icon: e.target.value } : null)}
                    placeholder="Enter emoji icon"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div className="bg-gray-50 rounded p-4">
                  <h5 className="font-medium mb-3">Template Structure Preview</h5>
                  <div className="text-sm space-y-2">
                    <div><strong>Title:</strong> {editingTemplate.template.title}</div>
                    <div><strong>Triggers:</strong> {editingTemplate.template.triggers.length} conditions</div>
                    <div><strong>Effects:</strong> {editingTemplate.template.effects.length} effects</div>
                    <div><strong>Choices:</strong> {editingTemplate.template.choices.length} options</div>
                    <div><strong>Tags:</strong> {editingTemplate.template.tags.join(', ') || 'None'}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveTemplate(editingTemplate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isCreating ? 'Create' : 'Save'} Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;