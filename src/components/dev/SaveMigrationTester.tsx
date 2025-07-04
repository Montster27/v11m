// /Users/montysharma/V11M2/src/components/dev/SaveMigrationTester.tsx
// Development component to test save/load migration functionality

import React, { useState, useEffect } from 'react';
import { useSaveStoreV2 } from '../../store/useSaveStoreV2';
import { 
  detectSaveFiles, 
  migrateAllLegacySaves, 
  createFullSaveBackup, 
  getMigrationStatus,
  type MigrationResult 
} from '../../utils/saveFormatMigration';

interface SaveMigrationTesterProps {
  onClose: () => void;
}

const SaveMigrationTester: React.FC<SaveMigrationTesterProps> = ({ onClose }) => {
  const [migrationStatus, setMigrationStatus] = useState(getMigrationStatus());
  const [saveFiles, setSaveFiles] = useState(detectSaveFiles());
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [backupId, setBackupId] = useState<string>('');
  
  const {
    getSaveSlots,
    createSave,
    loadSave,
    validateSaveIntegrity,
    migrateLegacySave
  } = useSaveStoreV2();

  // Refresh data
  const refreshStatus = () => {
    setMigrationStatus(getMigrationStatus());
    setSaveFiles(detectSaveFiles());
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  // Create test save data
  const createTestSave = async () => {
    setIsLoading(true);
    const results: string[] = [];
    
    try {
      // Simulate some game state
      if (typeof window !== 'undefined' && (window as any).useAppStore) {
        (window as any).useAppStore.setState({
          day: 5,
          experience: 100,
          userLevel: 2,
          resources: { energy: 80, stress: 20, money: 50, knowledge: 30, social: 40 }
        });
        results.push('✅ Set up test game state');
      }
      
      const saveId = createSave('Test Save for Migration');
      if (saveId) {
        results.push(`✅ Created test save: ${saveId}`);
        refreshStatus();
      } else {
        results.push('❌ Failed to create test save');
      }
    } catch (error) {
      results.push(`❌ Error creating test save: ${error}`);
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  // Test loading a save
  const testLoadSave = async (saveId: string) => {
    setIsLoading(true);
    const results: string[] = [...testResults];
    
    try {
      const success = loadSave(saveId);
      if (success) {
        results.push(`✅ Successfully loaded save: ${saveId}`);
        
        // Verify loaded state
        if (typeof window !== 'undefined' && (window as any).useAppStore) {
          const state = (window as any).useAppStore.getState();
          results.push(`📊 Loaded state - Day: ${state.day}, Level: ${state.userLevel}, XP: ${state.experience}`);
        }
      } else {
        results.push(`❌ Failed to load save: ${saveId}`);
      }
    } catch (error) {
      results.push(`❌ Error loading save: ${error}`);
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  // Run full migration test
  const runMigrationTest = async () => {
    setIsLoading(true);
    const results: string[] = [];
    
    try {
      // Create backup first
      const backup = createFullSaveBackup();
      setBackupId(backup);
      results.push(`💾 Created backup: ${backup}`);
      
      // Run migration
      const result = migrateAllLegacySaves({
        createBackups: true,
        validateIntegrity: true,
        preserveLegacy: true,
        logDetails: true
      });
      
      setMigrationResult(result);
      
      if (result.success) {
        results.push(`✅ Migration successful: ${result.migratedSaves.length} saves migrated`);
        result.migratedSaves.forEach(saveId => {
          results.push(`  📁 Migrated: ${saveId}`);
        });
        result.backups.forEach(backupId => {
          results.push(`  💾 Backup: ${backupId}`);
        });
      } else {
        results.push(`❌ Migration failed with ${result.errors.length} errors:`);
        result.errors.forEach(error => {
          results.push(`  ⚠️ ${error}`);
        });
      }
      
      refreshStatus();
    } catch (error) {
      results.push(`❌ Migration test error: ${error}`);
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  // Test save integrity
  const testSaveIntegrity = () => {
    const results: string[] = [...testResults];
    const saveSlots = getSaveSlots();
    
    results.push(`🔍 Testing integrity of ${saveSlots.length} saves...`);
    
    saveSlots.forEach(slot => {
      if (slot.data) {
        const isValid = validateSaveIntegrity(slot.data as any);
        results.push(`${isValid ? '✅' : '❌'} ${slot.name} (${slot.data.version})`);
      }
    });
    
    setTestResults(results);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Save Migration Tester</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Migration Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Migration Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Legacy Saves:</span>
                <span className="font-mono">{migrationStatus.legacyCount}</span>
              </div>
              <div className="flex justify-between">
                <span>V2 Saves:</span>
                <span className="font-mono">{migrationStatus.v2Count}</span>
              </div>
              <div className="flex justify-between">
                <span>Needs Migration:</span>
                <span className={`font-semibold ${migrationStatus.needsMigration ? 'text-orange-600' : 'text-green-600'}`}>
                  {migrationStatus.needsMigration ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-blue-800">
                <strong>Recommendation:</strong> {migrationStatus.recommendation}
              </div>
            </div>
          </div>

          {/* Save Files Detection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Detected Save Files</h3>
            <div className="space-y-3 text-sm">
              {saveFiles.legacy.length > 0 && (
                <div>
                  <div className="font-medium text-orange-600">Legacy Saves ({saveFiles.legacy.length})</div>
                  <div className="max-h-20 overflow-y-auto">
                    {saveFiles.legacy.map(file => (
                      <div key={file} className="font-mono text-xs text-gray-600 truncate">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {saveFiles.v2.length > 0 && (
                <div>
                  <div className="font-medium text-green-600">V2 Saves ({saveFiles.v2.length})</div>
                  <div className="max-h-20 overflow-y-auto">
                    {saveFiles.v2.map(file => (
                      <div key={file} className="font-mono text-xs text-gray-600 truncate">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {saveFiles.unknown.length > 0 && (
                <div>
                  <div className="font-medium text-gray-600">Unknown ({saveFiles.unknown.length})</div>
                  <div className="max-h-20 overflow-y-auto">
                    {saveFiles.unknown.map(file => (
                      <div key={file} className="font-mono text-xs text-gray-600 truncate">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Test Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={createTestSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Create Test Save
            </button>
            
            <button
              onClick={runMigrationTest}
              disabled={isLoading || migrationStatus.legacyCount === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Run Migration Test
            </button>
            
            <button
              onClick={testSaveIntegrity}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Save Integrity
            </button>
            
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Current Save Slots */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Save Slots</h3>
          <div className="space-y-2">
            {getSaveSlots().map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <div className="font-medium">{slot.name}</div>
                  <div className="text-sm text-gray-600">
                    Day {slot.gameDay} • Level {slot.preview.level} • {slot.data?.version || 'Unknown Version'}
                  </div>
                </div>
                <button
                  onClick={() => testLoadSave(slot.id)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Test Load
                </button>
              </div>
            ))}
            {getSaveSlots().length === 0 && (
              <div className="text-gray-500 text-center py-4">No save slots found</div>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mt-6 bg-gray-900 text-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-white">Test Results</h3>
            <div className="space-y-1 font-mono text-sm max-h-40 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-3 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        )}

        {/* Migration Result */}
        {migrationResult && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Migration Result</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-semibold ${migrationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {migrationResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Migrated Saves:</span>
                <span className="font-mono">{migrationResult.migratedSaves.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-mono">{migrationResult.errors.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Backups Created:</span>
                <span className="font-mono">{migrationResult.backups.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Backup Info */}
        {backupId && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-sm text-green-800">
              <strong>Backup Created:</strong> <code className="bg-green-100 px-1 rounded">{backupId}</code>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-800 rounded">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Running test...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveMigrationTester;