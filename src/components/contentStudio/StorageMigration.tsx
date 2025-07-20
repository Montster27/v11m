// Storage Migration UI Component
// Provides user interface for migrating from localStorage to IndexedDB

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../ui';
import { StorageMigrationService, MigrationProgress, MigrationResult } from '../../services/storage/StorageMigrationService';
import { IndexedDBAdapter } from '../../services/storage/IndexedDBAdapter';

type MigrationStatus = 'checking' | 'pending' | 'migrating' | 'verifying' | 'complete' | 'failed' | 'not-needed';

interface StorageMigrationProps {
  onMigrationComplete?: () => void;
  onSkip?: () => void;
}

export const StorageMigration: React.FC<StorageMigrationProps> = ({
  onMigrationComplete,
  onSkip
}) => {
  const [migrationService] = useState(() => new StorageMigrationService());
  const [status, setStatus] = useState<MigrationStatus>('checking');
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0
  });
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Check if migration is needed on component mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = useCallback(async () => {
    setStatus('checking');
    setError(null);

    try {
      const migrationStatus = migrationService.getMigrationStatus();
      
      if (migrationStatus.isMigrated) {
        setStatus('complete');
        if (onMigrationComplete) {
          setTimeout(onMigrationComplete, 1000);
        }
        return;
      }

      if (!migrationStatus.canMigrate) {
        setStatus('not-needed');
        return;
      }

      const shouldMigrate = await migrationService.shouldMigrate();
      if (!shouldMigrate) {
        setStatus('not-needed');
        return;
      }

      setStatus('pending');
    } catch (err) {
      console.error('Failed to check migration status:', err);
      setError('Failed to check migration status');
      setStatus('failed');
    }
  }, [migrationService, onMigrationComplete]);

  const handleMigrate = useCallback(async () => {
    setStatus('migrating');
    setError(null);
    setProgress({ total: 0, completed: 0, failed: 0, percentage: 0 });

    try {
      const migrationResult = await migrationService.migrateFromLocalStorage({
        validateData: true,
        batchSize: 5,
        onProgress: (progressUpdate) => {
          setProgress(progressUpdate);
        }
      });

      setResult(migrationResult);

      if (migrationResult.success) {
        setStatus('verifying');
        
        // Verify migration
        const verification = await migrationService.verifyMigration();
        
        if (verification.verified) {
          await migrationService.markMigrationComplete();
          setStatus('complete');
          
          if (onMigrationComplete) {
            setTimeout(onMigrationComplete, 2000);
          }
        } else {
          setError(`Migration verification failed: ${verification.missing.length} missing items, ${verification.mismatches.length} mismatches`);
          setStatus('failed');
        }
      } else {
        setError(`Migration failed: ${migrationResult.failed.length} items could not be migrated`);
        setStatus('failed');
      }
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown migration error');
      setStatus('failed');
    }
  }, [migrationService, onMigrationComplete]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await handleMigrate();
    setIsRetrying(false);
  }, [handleMigrate]);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  const handleUseIndexedDB = useCallback(async () => {
    try {
      await migrationService.markMigrationComplete();
      if (onMigrationComplete) {
        onMigrationComplete();
      }
    } catch (err) {
      setError('Failed to enable IndexedDB storage');
    }
  }, [migrationService, onMigrationComplete]);

  // Render different states
  if (status === 'checking') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="text-lg font-semibold">Checking Storage Status</h2>
            <p className="text-sm text-gray-600">
              Analyzing your content storage requirements...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'not-needed') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="text-green-600 text-4xl">✓</div>
            <h2 className="text-lg font-semibold">Storage Ready</h2>
            <p className="text-sm text-gray-600">
              Your storage is optimized and ready to use.
            </p>
            <Button onClick={handleSkip} variant="primary" className="w-full">
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="text-green-600 text-4xl">🎉</div>
            <h2 className="text-lg font-semibold">Migration Complete!</h2>
            <p className="text-sm text-gray-600">
              Your content has been successfully migrated to enhanced storage.
              You now have much more space and better performance.
            </p>
            {result && (
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <div>Migrated: {result.migrated.length} items</div>
                <div>Total size: Enhanced capacity</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Main migration interface
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-lg w-full mx-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {status === 'pending' && 'Storage Upgrade Available'}
              {status === 'migrating' && 'Migrating Your Content'}
              {status === 'verifying' && 'Verifying Migration'}
              {status === 'failed' && 'Migration Issue'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {status === 'pending' && 'We can upgrade your storage for better performance and more space.'}
              {status === 'migrating' && 'Moving your content to enhanced storage...'}
              {status === 'verifying' && 'Ensuring all content was migrated correctly...'}
              {status === 'failed' && 'There was an issue with the migration process.'}
            </p>
          </div>

          {/* Progress (during migration) */}
          {status === 'migrating' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {progress.currentKey ? `Processing: ${progress.currentKey}` : 'Preparing...'}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {progress.completed} of {progress.total} items completed
                {progress.failed > 0 && `, ${progress.failed} failed`}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 text-sm font-medium">Error</div>
              <div className="text-red-700 text-sm mt-1">{error}</div>
              {result && result.errors.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-red-600 text-xs underline"
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </button>
                  {showDetails && (
                    <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                      {result.errors.slice(0, 5).map((err, index) => (
                        <div key={index}>{err.key}: {err.error}</div>
                      ))}
                      {result.errors.length > 5 && (
                        <div>... and {result.errors.length - 5} more</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {status === 'pending' && (
              <>
                <Button 
                  onClick={handleMigrate} 
                  variant="primary" 
                  className="flex-1"
                >
                  Upgrade Storage
                </Button>
                <Button 
                  onClick={handleSkip} 
                  variant="outline" 
                  className="flex-1"
                >
                  Continue with Current
                </Button>
              </>
            )}

            {status === 'failed' && (
              <>
                <Button 
                  onClick={handleRetry} 
                  variant="primary" 
                  className="flex-1"
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry Migration'}
                </Button>
                <Button 
                  onClick={handleUseIndexedDB} 
                  variant="outline" 
                  className="flex-1"
                >
                  Use New Storage
                </Button>
                <Button 
                  onClick={handleSkip} 
                  variant="outline"
                >
                  Skip
                </Button>
              </>
            )}

            {(status === 'migrating' || status === 'verifying') && (
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
              >
                {status === 'migrating' ? 'Migrating...' : 'Verifying...'}
              </Button>
            )}
          </div>

          {/* Benefits */}
          {status === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 text-sm font-medium">Benefits of Upgrading:</div>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• 10x more storage space (from 5MB to 50GB+)</li>
                <li>• Faster backup and restore operations</li>
                <li>• Better reliability and data integrity</li>
                <li>• Support for larger projects</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StorageMigration;