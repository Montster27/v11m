// /Users/montysharma/V11M2/src/components/ContentStudio.tsx

import React, { useState, useEffect } from 'react';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { useCoreGameStore } from '../stores/v2/useCoreGameStore';
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
import StorageMigration from './contentStudio/StorageMigration';
import { StorageMigrationService } from '../services/storage/StorageMigrationService';
import { StorageAdapter } from '../services/storage/StorageAdapter';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { IndexedDBAdapter } from '../services/storage/IndexedDBAdapter';
import { ContentExportService } from '../services/ContentExportService';
import { v2Migration } from '../migrations/v2StoreMigration';
import type { Storylet } from '../types/storylet';

type ContentStudioTab = 'advanced' | 'browse' | 'visual' | 'arc-manager' | 'clue-manager' | 'characters' | 'preview' | 'analytics';

interface ContentStudioProps {
  onBackupCreate?: () => void;
}

const ContentStudio: React.FC<ContentStudioProps> = ({ onBackupCreate }) => {
  // V2 Store access
  const narrativeStore = useNarrativeStore();
  const socialStore = useSocialStore();
  const coreGameStore = useCoreGameStore();
  
  // Storage management
  const [storageAdapter, setStorageAdapter] = useState<StorageAdapter | null>(null);
  const [migrationService] = useState(() => new StorageMigrationService());
  const [showMigration, setShowMigration] = useState(false);
  
  // UI State
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

  // Storage initialization and migration check
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check V2 store migration status first
        const v2Status = v2Migration.getMigrationStatus();
        if (v2Status.canMigrate && !v2Status.isComplete) {
          console.log('🔄 Running V2 store migration...');
          try {
            const result = await v2Migration.runV2Migration({
              validateMigration: true,
              backupBeforeMigration: true
            });
            if (result.success) {
              console.log('✅ V2 migration completed:', result.migratedData);
            } else {
              console.error('❌ V2 migration failed:', result.errors);
            }
          } catch (error) {
            console.error('❌ V2 migration error:', error);
          }
        }

        const migrationStatus = migrationService.getMigrationStatus();
        
        if (migrationStatus.isMigrated) {
          // Use IndexedDB
          const adapter = new IndexedDBAdapter({
            dbName: 'ContentStudioDB',
            storeName: 'backups',
            version: 1
          });
          await adapter.initialize();
          setStorageAdapter(adapter);
          console.log('✅ Using IndexedDB storage');
        } else {
          // Check if migration should be offered
          const shouldMigrate = await migrationService.shouldMigrate();
          if (shouldMigrate && migrationStatus.canMigrate) {
            setShowMigration(true);
            return; // Don't set storage adapter yet
          }
          
          // Use localStorage
          setStorageAdapter(new LocalStorageAdapter());
          console.log('✅ Using localStorage storage');
        }
      } catch (error) {
        console.error('Storage initialization failed:', error);
        // Fallback to localStorage
        setStorageAdapter(new LocalStorageAdapter());
      }
    };

    initializeStorage();
  }, [migrationService]);

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

  // Auto-backup before destructive actions (V2 Enhanced with unified export)
  const createBackup = async () => {
    try {
      const timestamp = new Date().toISOString();

      // Use new unified export service if storage adapter is available
      if (storageAdapter) {
        try {
          const exportService = new ContentExportService(storageAdapter);
          const exportPackage = await exportService.exportProject({
            format: 'json',
            includeMetadata: true,
            validateDependencies: false, // Skip for quick backups
            includePreferences: true
          });

          const backupKey = `content_backup_v2_${timestamp}`;
          await storageAdapter.setItem(backupKey, JSON.stringify(exportPackage));

          // Keep only last 5 V2 backups
          const allKeys = await storageAdapter.getKeys();
          const backupKeys = allKeys.filter(key => key.startsWith('content_backup_v2_'));
          if (backupKeys.length > 5) {
            const sortedKeys = backupKeys.sort().slice(0, -5);
            for (const key of sortedKeys) {
              await storageAdapter.removeItem(key);
            }
          }

          console.log('✅ V2 Auto-backup created:', backupKey);
          onBackupCreate?.();
          return true;
        } catch (exportError) {
          console.warn('⚠️ V2 backup failed, falling back to legacy backup:', exportError);
          // Fall through to legacy backup
        }
      }

      // Legacy backup method (for backward compatibility)
      const gameState = {
        // V2 stores
        narrative: narrativeStore,
        social: socialStore,
        core: coreGameStore,
        // Legacy format compatibility (using V2 data)
        storylets: narrativeStore.getStorylets(), // Use V2 narrative store for storylets
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
      
      console.log('✅ Legacy auto-backup created:', backupKey);
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

  // Migration event handlers
  const handleMigrationComplete = async () => {
    setShowMigration(false);
    
    // Initialize IndexedDB adapter
    const adapter = new IndexedDBAdapter({
      dbName: 'ContentStudioDB',
      storeName: 'backups',
      version: 1
    });
    await adapter.initialize();
    setStorageAdapter(adapter);
    console.log('✅ Migration complete, now using IndexedDB storage');
  };

  const handleMigrationSkip = () => {
    setShowMigration(false);
    setStorageAdapter(new LocalStorageAdapter());
    console.log('✅ Migration skipped, continuing with localStorage');
  };

  // Show migration UI if needed
  if (showMigration) {
    return (
      <StorageMigration
        onMigrationComplete={handleMigrationComplete}
        onSkip={handleMigrationSkip}
      />
    );
  }

  // Don't render main UI until storage is initialized
  if (!storageAdapter) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Initializing Content Studio...</p>
        </div>
      </div>
    );
  }

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