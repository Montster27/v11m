// /Users/montysharma/v11m2/src/tests/storyArcV2Integration.test.ts
// Integration tests for Story Arc V2 architecture
// Tests migration, StoryArcManager, and V2 store integration

import { storyArcManager } from '../utils/storyArcManager';
import { migrateExistingArcs, getMigrationStatus } from '../scripts/migrateStoryArcs';
import { restoreAllSampleArcs, verifyArcDataIntegrity } from '../data/arcs/restoreArcData';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';

// Mock the stores for testing
vi.mock('../stores/v2/useNarrativeStore');
vi.mock('../stores/v2/useSocialStore');

describe('Story Arc V2 Integration', () => {
  beforeEach(() => {
    // Initialize mock stores
    const mockNarrativeStore = {
      storyArcs: [],
      createArc: vi.fn(),
      updateArc: vi.fn(),
      deleteArc: vi.fn(),
      getArc: vi.fn(),
      getAllArcs: vi.fn(() => []),
      resetNarrative: vi.fn()
    };

    const mockSocialStore = {
      arcRelationships: {},
      arcDiscoveryProgress: {},
      setClueArcRelationship: vi.fn(),
      removeClueArcRelationship: vi.fn(),
      getCluesByArc: vi.fn(() => []),
      getArcCompletionPercentage: vi.fn(() => 0),
      getNextClueInArc: vi.fn(() => null),
      initializeArcProgress: vi.fn(),
      resetSocial: vi.fn()
    };

    // Set up window mocks
    (window as any).useNarrativeStore = {
      getState: () => mockNarrativeStore
    };
    
    (window as any).useSocialStore = {
      getState: () => mockSocialStore
    };
  });

  describe('StoryArcManager Basic Operations', () => {
    test('should create and retrieve story arcs', () => {
      const arcId = storyArcManager.createArc({
        name: 'Test Arc',
        description: 'A test story arc for validation',
        progress: 0,
        isCompleted: false
      });

      expect(arcId).toBeDefined();
      expect(typeof arcId).toBe('string');

      const retrievedArc = storyArcManager.getArc(arcId);
      expect(retrievedArc).toBeDefined();
      expect(retrievedArc?.name).toBe('Test Arc');
      expect(retrievedArc?.description).toBe('A test story arc for validation');
      expect(retrievedArc?.progress).toBe(0);
      expect(retrievedArc?.isCompleted).toBe(false);
    });

    test('should update story arc properties', () => {
      const arcId = storyArcManager.createArc({
        name: 'Update Test Arc',
        description: 'Original description',
        progress: 0,
        isCompleted: false
      });

      storyArcManager.updateArc(arcId, {
        description: 'Updated description',
        progress: 0.5
      });

      const updatedArc = storyArcManager.getArc(arcId);
      expect(updatedArc?.description).toBe('Updated description');
      expect(updatedArc?.progress).toBe(0.5);
      expect(updatedArc?.name).toBe('Update Test Arc'); // Should remain unchanged
    });

    test('should delete story arcs and clean up relationships', () => {
      const arcId = storyArcManager.createArc({
        name: 'Delete Test Arc',
        description: 'Arc to be deleted',
        progress: 0,
        isCompleted: false
      });

      // Assign a clue to the arc
      storyArcManager.assignClueToArc('test-clue-id', arcId, 1);

      // Verify arc exists
      expect(storyArcManager.getArc(arcId)).toBeDefined();

      // Delete the arc
      storyArcManager.deleteArc(arcId);

      // Verify arc is deleted
      expect(storyArcManager.getArc(arcId)).toBeNull();

      // Verify clue relationships are cleaned up
      const socialStore = (window as any).useSocialStore;
      if (socialStore) {
        const arcClues = socialStore.getState().getCluesByArc(arcId);
        expect(arcClues).toHaveLength(0);
      }
    });
  });

  describe('Arc Progress Management', () => {
    test('should track arc progress correctly', () => {
      const arcId = storyArcManager.createArc({
        name: 'Progress Test Arc',
        description: 'Testing progress tracking',
        progress: 0,
        isCompleted: false
      });

      // Start the arc
      storyArcManager.startArc(arcId);
      const startedArc = storyArcManager.getArc(arcId);
      expect(startedArc?.startedAt).toBeDefined();

      // Progress a storylet
      storyArcManager.assignStoryletToArc('test-storylet-1', arcId);
      storyArcManager.progressArcStorylet(arcId, 'test-storylet-1');

      const progress = storyArcManager.getArcProgress(arcId);
      expect(progress).toBeDefined();
      expect(progress?.completedStorylets).toContain('test-storylet-1');
    });

    test('should complete arcs properly', () => {
      const arcId = storyArcManager.createArc({
        name: 'Completion Test Arc',
        description: 'Testing arc completion',
        progress: 0,
        isCompleted: false
      });

      storyArcManager.completeArc(arcId);
      
      const completedArc = storyArcManager.getArc(arcId);
      expect(completedArc?.isCompleted).toBe(true);
      expect(completedArc?.completedAt).toBeDefined();
      expect(completedArc?.progress).toBe(1.0);
    });

    test('should record failures with context', () => {
      const arcId = storyArcManager.createArc({
        name: 'Failure Test Arc',
        description: 'Testing failure recording',
        progress: 0,
        isCompleted: false
      });

      storyArcManager.recordArcFailure(arcId, 'Test failure reason');
      
      const arcWithFailure = storyArcManager.getArc(arcId);
      expect(arcWithFailure?.failures).toBe(1);

      const progress = storyArcManager.getArcProgress(arcId);
      expect(progress?.failures).toHaveLength(1);
      expect(progress?.failures[0].reason).toBe('Test failure reason');
    });
  });

  describe('Clue-Arc Integration', () => {
    test('should assign clues to arcs with proper relationships', () => {
      const arcId = storyArcManager.createArc({
        name: 'Clue Integration Test Arc',
        description: 'Testing clue relationships',
        progress: 0,
        isCompleted: false
      });

      storyArcManager.assignClueToArc('test-clue-1', arcId, 1);
      storyArcManager.assignClueToArc('test-clue-2', arcId, 2);

      const arcClues = storyArcManager.getArcClues(arcId);
      expect(arcClues).toHaveLength(2);
      expect(arcClues).toContain('test-clue-1');
      expect(arcClues).toContain('test-clue-2');

      // Verify ordering
      expect(arcClues[0]).toBe('test-clue-1'); // Lower order should come first
    });

    test('should track clue discovery progress', () => {
      const arcId = storyArcManager.createArc({
        name: 'Clue Progress Test Arc',
        description: 'Testing clue discovery tracking',
        progress: 0,
        isCompleted: false
      });

      // Initialize arc progress
      const socialStore = (window as any).useSocialStore;
      if (socialStore) {
        socialStore.getState().initializeArcProgress(arcId, 2);
        
        // Assign clues
        storyArcManager.assignClueToArc('progress-clue-1', arcId, 1);
        storyArcManager.assignClueToArc('progress-clue-2', arcId, 2);

        // Progress first clue
        storyArcManager.progressArcClue(arcId, 'progress-clue-1');

        const completionPercentage = socialStore.getState().getArcCompletionPercentage(arcId);
        expect(completionPercentage).toBe(50); // 1 out of 2 clues
      }
    });
  });

  describe('Sample Arc Restoration', () => {
    test('should restore sample arcs successfully', () => {
      const createdArcs = restoreAllSampleArcs();
      
      expect(createdArcs).toHaveLength(3);
      expect(createdArcs.every(arcId => typeof arcId === 'string')).toBe(true);

      // Verify each arc was created
      createdArcs.forEach(arcId => {
        const arc = storyArcManager.getArc(arcId);
        expect(arc).toBeDefined();
        expect(arc?.name).toBeDefined();
        expect(arc?.description).toBeDefined();
      });
    });

    test('should verify arc data integrity after restoration', () => {
      restoreAllSampleArcs();
      
      const integrity = verifyArcDataIntegrity();
      expect(integrity.success).toBe(true);
      expect(integrity.issues).toHaveLength(0);
    });
  });

  describe('Arc Statistics and Analytics', () => {
    test('should provide comprehensive arc statistics', () => {
      const arcId = storyArcManager.createArc({
        name: 'Statistics Test Arc',
        description: 'Testing statistics generation',
        progress: 0,
        isCompleted: false
      });

      // Add some data
      storyArcManager.assignStoryletToArc('stats-storylet-1', arcId);
      storyArcManager.assignClueToArc('stats-clue-1', arcId, 1);

      const stats = storyArcManager.getArcStatistics(arcId);
      expect(stats).toBeDefined();
      expect(stats.totalStorylets).toBeGreaterThanOrEqual(1);
      expect(stats.totalClues).toBeGreaterThanOrEqual(1);
      expect(stats.completionPercentage).toBe(0); // No progress yet
      expect(stats.failures).toBe(0);
    });

    test('should track completion rate across all arcs', () => {
      // Create multiple arcs with different completion states
      const arc1 = storyArcManager.createArc({
        name: 'Completed Arc',
        description: 'This arc is completed',
        progress: 1,
        isCompleted: true
      });

      const arc2 = storyArcManager.createArc({
        name: 'Incomplete Arc',
        description: 'This arc is not completed',
        progress: 0.5,
        isCompleted: false
      });

      const completionRate = storyArcManager.getArcCompletionRate();
      expect(completionRate).toBe(50); // 1 out of 2 arcs completed
    });
  });

  describe('Arc Validation', () => {
    test('should validate arc integrity', () => {
      const arcId = storyArcManager.createArc({
        name: 'Validation Test Arc',
        description: 'Testing validation',
        progress: 0,
        isCompleted: false
      });

      // Arc without storylets or clues should have validation issues
      const validation = storyArcManager.validateArc(arcId);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('No clues assigned to arc');
      expect(validation.issues).toContain('No storylets assigned to arc');

      // Add storylets and clues
      storyArcManager.assignStoryletToArc('validation-storylet-1', arcId);
      storyArcManager.assignClueToArc('validation-clue-1', arcId, 1);

      const validationAfterAssignment = storyArcManager.validateArc(arcId);
      expect(validationAfterAssignment.isValid).toBe(true);
      expect(validationAfterAssignment.issues).toHaveLength(0);
    });
  });

  describe('Migration Status', () => {
    test('should provide accurate migration status', () => {
      const status = getMigrationStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.needsMigration).toBe('boolean');
      expect(typeof status.hasLegacyData).toBe('boolean');
      expect(typeof status.hasV2Data).toBe('boolean');
      expect(typeof status.recommendation).toBe('string');
    });
  });
});

// Export test utilities for manual testing
export const testUtilities = {
  createTestArc: () => storyArcManager.createArc({
    name: 'Manual Test Arc',
    description: 'Arc created for manual testing',
    progress: 0,
    isCompleted: false
  }),
  
  runBasicTest: () => {
    console.log('🧪 Running basic story arc test...');
    
    try {
      // Create arc
      const arcId = testUtilities.createTestArc();
      console.log('✅ Arc created:', arcId);
      
      // Assign clue
      storyArcManager.assignClueToArc('manual-test-clue', arcId, 1);
      console.log('✅ Clue assigned');
      
      // Get statistics
      const stats = storyArcManager.getArcStatistics(arcId);
      console.log('✅ Statistics retrieved:', stats);
      
      // Validate
      const validation = storyArcManager.validateArc(arcId);
      console.log('✅ Validation result:', validation);
      
      console.log('🎉 Basic test completed successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Basic test failed:', error);
      return false;
    }
  }
};

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).storyArcTestUtilities = testUtilities;
}