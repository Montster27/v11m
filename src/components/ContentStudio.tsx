// /Users/montysharma/V11M2/src/components/ContentStudio.tsx

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { useUndoRedo } from '../hooks/useUndoRedo';
import AdvancedStoryletCreator from './contentStudio/AdvancedStoryletCreator';
import StoryletBrowser from './contentStudio/StoryletBrowser';
import CharacterBuilder from './contentStudio/CharacterBuilder';
import PreviewSandbox from './contentStudio/PreviewSandbox';
import ContentAnalytics from './contentStudio/ContentAnalytics';
import VisualStoryletEditor from './contentStudio/VisualStoryletEditor';
import ArcManager from './contentStudio/ArcManager';
import ClueManager from './contentStudio/ClueManager';
import SafetyManager from './contentStudio/SafetyManager';
import HelpTooltip from './ui/HelpTooltip';
import ConfirmationDialog from './ui/ConfirmationDialog';
import type { Storylet } from '../types/storylet';

type ContentStudioTab = 'advanced' | 'browse' | 'visual' | 'arc-manager' | 'clue-manager' | 'characters' | 'preview' | 'analytics';

interface ContentStudioProps {
  onBackupCreate?: () => void;
}

const ContentStudio: React.FC<ContentStudioProps> = ({ onBackupCreate }) => {
  // V2 Store access
  const narrativeStore = useNarrativeStore();
  const socialStore = useSocialStore();
  const catalogStore = useStoryletCatalogStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentStudioTab>('advanced');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingStorylet, setEditingStorylet] = useState<Storylet | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: () => void;
    title: string;
    message: string;
    type: 'warning' | 'danger';
  } | null>(null);

  // Navigation event listeners for ArcManager
  useEffect(() => {
    const handleNavigateToVisualArcBuilder = () => {
      setActiveTab('visual');
      // The visual editor will detect this navigation and switch to arc mode
    };
    
    const handleNavigateToAdvancedCreator = () => {
      setActiveTab('advanced');
    };

    window.addEventListener('navigate-to-visual-arc-builder', handleNavigateToVisualArcBuilder);
    window.addEventListener('navigate-to-advanced-creator', handleNavigateToAdvancedCreator);

    return () => {
      window.removeEventListener('navigate-to-visual-arc-builder', handleNavigateToVisualArcBuilder);
      window.removeEventListener('navigate-to-advanced-creator', handleNavigateToAdvancedCreator);
    };
  }, []);

  // Undo/Redo system
  const {
    executeAction,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastAction,
    undoStackSize,
    redoStackSize
  } = useUndoRedo(20);

  // Auto-backup before destructive actions (V2 Enhanced)
  const createBackup = () => {
    try {
      const timestamp = new Date().toISOString();
      const gameState = {
        app: useAppStore.getState(),
        // V2 stores
        narrative: narrativeStore,
        social: socialStore,
        catalog: catalogStore,
        // Legacy for backwards compatibility
        storylets: catalogStore, // Use catalog store as legacy storylets backup
        timestamp,
        version: '2.0' // Updated version for V2 backups
      };
      
      const backupKey = `content_backup_${timestamp}`;
      localStorage.setItem(backupKey, JSON.stringify(gameState));
      
      // Keep only last 5 backups
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('content_backup_'));
      if (allKeys.length > 5) {
        allKeys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key));
      }
      
      console.log('✅ Auto-backup created:', backupKey);
      onBackupCreate?.();
      return true;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return false;
    }
  };

  const executeWithConfirmation = (
    action: () => void,
    title: string,
    message: string,
    type: 'warning' | 'danger' = 'warning'
  ) => {
    setPendingAction({ action, title, message, type });
    setShowConfirmDialog(true);
  };

  const handleConfirmedAction = () => {
    if (pendingAction) {
      // Create backup before destructive actions
      if (pendingAction.type === 'danger') {
        createBackup();
      }
      
      pendingAction.action();
      setPendingAction(null);
    }
    setShowConfirmDialog(false);
  };

  const tabs = [
    {
      id: 'advanced' as const,
      label: 'Advanced Creator',
      icon: '⚙️',
      description: 'Create complex storylets with triggers, effects, and minigames'
    },
    {
      id: 'browse' as const,
      label: 'Browse & Edit',
      icon: '📚',
      description: 'Browse existing storylets and edit them'
    },
    {
      id: 'visual' as const,
      label: 'Visual Editor',
      icon: '🎨',
      description: 'Drag-and-drop flowchart editor for complex storylines'
    },
    {
      id: 'arc-manager' as const,
      label: 'Arc Manager',
      icon: '🔗',
      description: 'Manage story arcs, connections, and testing'
    },
    {
      id: 'clue-manager' as const,
      label: 'Clues & Minigames',
      icon: '🔍',
      description: 'Create clues, configure discovery methods, and test minigames'
    },
    {
      id: 'characters' as const,
      label: 'Character Builder',
      icon: '👥',
      description: 'Design NPCs with personality and relationship tools'
    },
    {
      id: 'preview' as const,
      label: 'Preview Mode',
      icon: '🎮',
      description: 'Test your content safely before publishing'
    },
    {
      id: 'analytics' as const,
      label: 'Content Analytics',
      icon: '📊',
      description: 'View engagement and performance data'
    }
  ];

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Content Studio Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg h-full overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Content Studio</h2>
              <p className="text-blue-100 text-sm">Create, edit, and manage game content</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Undo/Redo Controls */}
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-1 rounded text-sm ${
                    canUndo 
                      ? 'text-blue-100 hover:text-white hover:bg-blue-500' 
                      : 'text-blue-300 cursor-not-allowed'
                  }`}
                  title={canUndo ? `Undo: ${getLastAction()?.description || 'Last action'}` : 'Nothing to undo'}
                >
                  ↶
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`p-1 rounded text-sm ${
                    canRedo 
                      ? 'text-blue-100 hover:text-white hover:bg-blue-500' 
                      : 'text-blue-300 cursor-not-allowed'
                  }`}
                  title={canRedo ? 'Redo last undone action' : 'Nothing to redo'}
                >
                  ↷
                </button>
                {(undoStackSize > 0 || redoStackSize > 0) && (
                  <span className="text-xs text-blue-200 ml-1">
                    {undoStackSize}/{undoStackSize + redoStackSize}
                  </span>
                )}
              </div>
              <HelpTooltip content="Content Studio provides user-friendly tools for creating stories, characters, and quests without technical knowledge." />
              <SafetyManager onBackupCreate={createBackup} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-white'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'advanced' && (
            <AdvancedStoryletCreator 
              undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
              onExecuteAction={executeWithConfirmation}
              editingStorylet={editingStorylet}
              onStoryletSaved={() => {
                setEditingStorylet(null);
                if (editingStorylet) {
                  setActiveTab('browse');
                }
              }}
            />
          )}
          
          {activeTab === 'browse' && (
            <div className="h-full overflow-y-auto">
              <StoryletBrowser
                onEditStorylet={(storylet) => {
                  setEditingStorylet(storylet);
                  setActiveTab('advanced');
                }}
                onEditVisually={(storylet) => {
                  setEditingStorylet(storylet);
                  setActiveTab('visual');
                }}
                undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
              />
            </div>
          )}
          
          {activeTab === 'visual' && (
            <div className="h-full overflow-hidden">
              <VisualStoryletEditor 
                undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
                onSave={(flowData) => {
                  console.log('Flow saved:', flowData);
                  // Here you would integrate with the storylet store
                }}
                editingStorylet={editingStorylet}
                onStoryletSaved={() => {
                  setEditingStorylet(null);
                  if (editingStorylet) {
                    setActiveTab('browse');
                  }
                }}
                mode={editingStorylet ? "storylet" : "arc"}
                onArcSaved={(arc) => {
                  console.log('Story arc saved:', arc);
                  // Here you would save the arc to the storylet store
                }}
              />
            </div>
          )}
          
          {activeTab === 'arc-manager' && (
            <div className="h-full overflow-hidden">
              <ArcManager 
                undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
              />
            </div>
          )}
          
          {activeTab === 'clue-manager' && (
            <div className="h-full overflow-hidden">
              <ClueManager 
                undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
              />
            </div>
          )}
          
          {activeTab === 'characters' && (
            <div className="h-full overflow-y-auto">
              <CharacterBuilder 
                onExecuteAction={executeWithConfirmation}
                undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
              />
            </div>
          )}
          
          {activeTab === 'preview' && (
            <div className="h-full overflow-y-auto">
              <PreviewSandbox 
                undoRedoSystem={{ executeAction, undo, redo, canUndo, canRedo }}
              />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="h-full overflow-y-auto">
              <ContentAnalytics />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>💡 Tip: Use Preview Mode to test changes safely</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Content Studio Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmedAction}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        type={pendingAction?.type || 'warning'}
      />
    </div>
  );
};

export default ContentStudio;