import React, { useState, useEffect } from 'react';
import { Button, Card } from './ui';
import { MemoryCardGame } from './minigames';
import StroopTestGame from './minigames/StroopTestGame';
import WordScrambleGame from './minigames/WordScrambleGame';
import ColorMatchGame from './minigames/ColorMatchGame';
import { useClueStore } from '../store/useClueStore';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import type { MinigameType } from '../types/storylet';
import type { Clue } from '../types/clue';

interface ClueDiscoveryManagerProps {
  clueId: string;
  minigameType: MinigameType;
  onComplete: (success: boolean, clue: Clue | null) => void;
  onClose: () => void;
}

type DiscoveryState = 'description' | 'minigame' | 'result' | 'follow-up';

const ClueDiscoveryManager: React.FC<ClueDiscoveryManagerProps> = ({
  clueId,
  minigameType,
  onComplete,
  onClose
}) => {
  // Legacy stores for data access (still sources of truth)
  const { getClueById } = useClueStore();
  const { addStorylet, allStorylets } = useStoryletCatalogStore();
  
  // V2 stores for enhanced functionality
  const { unlockStorylet, setStoryletFlag } = useNarrativeStore();
  const { discoverClue } = useSocialStore();
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>('description');
  const [minigameSuccess, setMinigameSuccess] = useState<boolean | null>(null);
  const [minigameStats, setMinigameStats] = useState<any>(null);
  const [clue, setClue] = useState<Clue | null>(null);

  useEffect(() => {
    const foundClue = getClueById(clueId);
    setClue(foundClue);
  }, [clueId, getClueById]);

  const handleStartMinigame = () => {
    setDiscoveryState('minigame');
  };

  const handleMinigameComplete = (success: boolean, stats?: any) => {
    console.log(`🎮 Clue discovery minigame completed: ${success ? 'SUCCESS' : 'FAILURE'}`, { stats });
    setMinigameSuccess(success);
    setMinigameStats(stats);
    setDiscoveryState('result');
  };

  const handleViewFollowUp = () => {
    setDiscoveryState('follow-up');
  };

  const handleFinish = () => {
    if (clue && minigameSuccess !== null) {
      // Record clue discovery in V2 social store if successful
      if (minigameSuccess) {
        try {
          discoverClue(clue);
          console.log(`✅ Recorded clue discovery in V2 social store: ${clue.title}`);
        } catch (error) {
          console.warn('Could not record clue in V2 social store:', error);
        }
      }
      
      // Generate follow-up storylets based on success/failure
      generateFollowUpStorylets(clue, minigameSuccess);
      onComplete(minigameSuccess, clue);
    } else {
      onClose();
    }
  };

  const generateFollowUpStorylets = (clue: Clue, success: boolean) => {
    const successId = `clue_followup_${clue.id}_success`;
    const failureId = `clue_followup_${clue.id}_failure`;
    const targetId = success ? successId : failureId;
    
    // Check if pre-authored storylet exists
    const existingStorylet = allStorylets[targetId];
    if (existingStorylet) {
      console.log(`📖 Using pre-authored follow-up storylet: ${targetId}`);
      console.log(`📋 Pre-authored storylet details:`, {
        name: existingStorylet.name,
        description: existingStorylet.description,
        choices: existingStorylet.choices.length
      });
      
      // Set the flag that will unlock this storylet (V2 store)
      setStoryletFlag(`clue_discovery_${clue.id}_${success ? 'success' : 'failure'}`, true);
      
      // Unlock the storylet immediately
      unlockStorylet(targetId);
      
      return;
    }
    
    // Fallback to dynamic generation if no pre-authored storylet exists
    console.log(`📖 No pre-authored follow-up found for ${targetId}, generating dynamic storylet`);
    
    const baseId = targetId; // Use the same ID format for consistency
    
    const followUpStorylet = {
      id: baseId,
      name: success ? `${clue.title} - Discovery Successful` : `${clue.title} - Investigation Failed`,
      description: success 
        ? `You successfully uncovered the clue "${clue.title}". The pieces are starting to come together...`
        : `Despite your efforts, the clue "${clue.title}" remains elusive. Perhaps another approach is needed.`,
      trigger: {
        type: 'flag' as const,
        conditions: { flags: [`clue_discovery_${clue.id}_${success ? 'success' : 'failure'}`] }
      },
      choices: [
        {
          id: 'reflect',
          text: success ? 'Reflect on the discovery' : 'Consider alternative approaches',
          effects: success ? [
            { type: 'resource' as const, key: 'knowledge' as const, delta: 5 },
            { type: 'flag' as const, key: `clue_${clue.id}_reflected`, value: true }
          ] : [
            { type: 'resource' as const, key: 'stress' as const, delta: 3 },
            { type: 'flag' as const, key: `clue_${clue.id}_failed_attempt`, value: true }
          ]
        },
        {
          id: 'continue',
          text: 'Continue your investigation',
          effects: [
            { type: 'flag' as const, key: `clue_discovery_complete_${clue.id}`, value: true }
          ]
        }
      ],
      storyArc: clue.storyArc || 'Investigation',
      deploymentStatus: 'dev' as const
    };

    // Add the dynamically generated storylet to the system
    addStorylet(followUpStorylet);
    
    // Set the flag that will unlock this storylet (V2 store)
    setStoryletFlag(`clue_discovery_${clue.id}_${success ? 'success' : 'failure'}`, true);
    
    // Unlock the storylet immediately
    unlockStorylet(baseId);
    
    console.log(`📖 Generated dynamic follow-up storylet: ${baseId}`);
  };

  const renderMinigame = () => {
    if (!clue) return null;

    const minigameProps = {
      onGameComplete: handleMinigameComplete,
      onClose: () => {
        setMinigameSuccess(false);
        setDiscoveryState('result');
      },
      difficulty: clue.difficulty as 'easy' | 'medium' | 'hard'
    };

    switch (minigameType) {
      case 'memory-cards':
        return <MemoryCardGame {...minigameProps} />;
      case 'stroop-test':
        return <StroopTestGame {...minigameProps} />;
      case 'word-scramble':
        return <WordScrambleGame {...minigameProps} />;
      case 'color-match':
        return <ColorMatchGame {...minigameProps} />;
      default:
        return (
          <div className="text-center p-8">
            <div className="text-lg mb-4">🎮 Minigame Not Available</div>
            <div className="text-sm text-gray-600 mb-4">
              The requested minigame "{minigameType}" is not implemented yet.
            </div>
            <div className="text-xs text-blue-600 mb-4 bg-blue-50 p-3 rounded">
              Available minigames: memory-cards, word-scramble, color-match, stroop-test
            </div>
            <div className="space-x-2">
              <Button onClick={() => handleMinigameComplete(true, { simulated: true })}>
                Simulate Success
              </Button>
              <Button onClick={() => handleMinigameComplete(false, { simulated: true })} variant="outline">
                Simulate Failure
              </Button>
            </div>
          </div>
        );
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-700 bg-gray-100';
      case 'uncommon': return 'text-blue-700 bg-blue-100';
      case 'rare': return 'text-purple-700 bg-purple-100';
      case 'legendary': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (!clue) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 mb-2">❌ Clue Not Found</div>
            <div className="text-sm text-gray-600 mb-4">
              The clue with ID "{clueId}" could not be found.
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {discoveryState === 'description' && (
        <Card className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Clue Discovery</h2>
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(clue.difficulty)}`}>
                    {clue.difficulty.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityColor(clue.rarity)}`}>
                    {clue.rarity.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {minigameType.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <Button onClick={onClose} variant="outline" className="text-sm">
                ✕ Cancel
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">{clue.title}</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                {clue.description}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🎮 Challenge Ahead</h4>
              <p className="text-gray-700 text-sm mb-3">
                To uncover this clue, you'll need to successfully complete a <strong>{minigameType.replace('-', ' ')}</strong> challenge. 
                The difficulty is set to <strong>{clue.difficulty}</strong> based on the clue's complexity.
              </p>
              <p className="text-gray-600 text-xs">
                💡 <strong>Tip:</strong> Take your time and focus. Success will reveal the clue's content and unlock follow-up storylets.
              </p>
            </div>

            <div className="flex justify-center space-x-3 pt-4">
              <Button onClick={handleStartMinigame} className="px-6">
                🎯 Start Challenge
              </Button>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {discoveryState === 'minigame' && renderMinigame()}

      {discoveryState === 'result' && (
        <Card className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl mb-4 ${minigameSuccess ? '🎉' : '😔'}`}>
                {minigameSuccess ? '🎉' : '😔'}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${minigameSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {minigameSuccess ? 'Discovery Successful!' : 'Investigation Failed'}
              </h2>
              <p className="text-gray-600">
                {minigameSuccess 
                  ? 'You successfully completed the challenge and uncovered the clue!'
                  : 'The challenge proved too difficult this time. The clue remains hidden.'}
              </p>
            </div>

            {minigameStats && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📊 Performance</h4>
                <div className="text-sm text-gray-700">
                  {Object.entries(minigameStats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {minigameSuccess && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">🔍 {clue.title}</h3>
                <div className="text-green-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {clue.content}
                </div>
              </div>
            )}

            {!minigameSuccess && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">🚫 Clue Remains Hidden</h4>
                <p className="text-red-800 text-sm">
                  The clue's secrets remain locked away. You might need to improve your skills or try a different approach.
                  Don't give up - every failure is a step closer to success!
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-3 pt-4">
              <Button onClick={handleViewFollowUp}>
                📖 Continue Story
              </Button>
              <Button onClick={handleFinish} variant="outline">
                Finish
              </Button>
            </div>
          </div>
        </Card>
      )}

      {discoveryState === 'follow-up' && (
        <Card className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">📖 What Happens Next</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">
                {minigameSuccess ? '✅ Success Path' : '❌ Failure Path'}
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                {minigameSuccess 
                  ? `Your successful discovery of "${clue.title}" has unlocked new story possibilities. A follow-up storylet has been added to your available storylets.`
                  : `Your unsuccessful attempt at uncovering "${clue.title}" has created new challenges. A follow-up storylet has been added that deals with this setback.`}
              </p>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-medium text-blue-900 text-sm mb-1">
                  New Storylet: {minigameSuccess ? `${clue.title} - Discovery Successful` : `${clue.title} - Investigation Failed`}
                </div>
                <div className="text-blue-700 text-xs">
                  {minigameSuccess 
                    ? 'Reflect on your discovery and plan your next moves.'
                    : 'Consider alternative approaches and learn from this setback.'}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🎯 Character Development</h4>
              <div className="text-sm text-gray-700 space-y-1">
                {minigameSuccess ? (
                  <>
                    <div>• Knowledge increased (+5)</div>
                    <div>• Investigation skills improved</div>
                    <div>• Confidence in problem-solving boosted</div>
                  </>
                ) : (
                  <>
                    <div>• Stress increased (+3)</div>
                    <div>• Learned from failure</div>
                    <div>• Motivation to improve skills</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={handleFinish} className="px-8">
                Return to Game
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClueDiscoveryManager;