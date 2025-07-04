// /Users/montysharma/V11M2/src/components/minigames/PathPlanner/KeyLockHUD.tsx
import React from 'react';
import { Card } from '../../ui';
import { Key, Lock } from '../../../types/pathPlanner';

interface KeyLockHUDProps {
  keys: Key[];
  collectedKeys: string[];
  locks: Lock[];
  unlockedLocks: string[];
}

const KeyLockHUD: React.FC<KeyLockHUDProps> = ({
  keys,
  collectedKeys,
  locks,
  unlockedLocks
}) => {
  // Group keys and locks by ID for display
  const keyLockPairs = keys.map(key => {
    const correspondingLocks = locks.filter(lock => lock.keyId === key.id);
    return {
      key,
      locks: correspondingLocks,
      isCollected: collectedKeys.includes(key.id),
      areLocksUnlocked: correspondingLocks.every(lock => unlockedLocks.includes(lock.id))
    };
  });

  const completedPairs = keyLockPairs.filter(pair => pair.isCollected && pair.areLocksUnlocked).length;
  const totalPairs = keyLockPairs.length;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <span className="mr-2">🔑</span>
        Keys & Locks
      </h3>
      
      {/* Progress Overview */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{completedPairs}/{totalPairs}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalPairs > 0 ? (completedPairs / totalPairs) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Key-Lock Pairs */}
      <div className="space-y-3">
        {keyLockPairs.map((pair, index) => (
          <div key={pair.key.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔑</span>
                <span className="font-medium text-gray-700">Key {pair.key.id}</span>
                {pair.isCollected && (
                  <span className="text-green-600 text-sm">✓ Collected</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                ({pair.key.position.x}, {pair.key.position.y})
              </div>
            </div>
            
            {/* Associated Locks */}
            <div className="ml-6 space-y-1">
              {pair.locks.map(lock => (
                <div key={lock.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span>{unlockedLocks.includes(lock.id) ? '🔓' : '🔒'}</span>
                    <span className={unlockedLocks.includes(lock.id) ? 'text-green-600' : 'text-gray-600'}>
                      Lock {lock.id}
                    </span>
                    {unlockedLocks.includes(lock.id) && (
                      <span className="text-green-600 text-xs">Unlocked</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    ({lock.position.x}, {lock.position.y})
                  </div>
                </div>
              ))}
            </div>

            {/* Status Indicator */}
            <div className="mt-2 flex items-center justify-center">
              {!pair.isCollected ? (
                <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  Need to collect key
                </div>
              ) : !pair.areLocksUnlocked ? (
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Key collected, locks opening...
                </div>
              ) : (
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✓ Complete
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Walk over keys to collect them</li>
          <li>• Collected keys automatically unlock corresponding locks</li>
          <li>• You cannot pass through locked doors</li>
          <li>• Collect all keys to reach the goal</li>
        </ul>
      </div>
    </Card>
  );
};

export default KeyLockHUD;