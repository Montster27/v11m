// /Users/montysharma/v11m2/src/utils/storyArcManager.ts
// Unified Story Arc Manager - Single API for all arc operations
// Integrates with V2 stores for consolidated state management

import type { StoryArc, ArcProgress } from '../stores/v2/useNarrativeStore';
import type { Clue } from '../types/clue';
import type { Storylet } from '../types/storylet';

export interface CreateArcInput {
  name: string;
  description: string;
  progress?: number;
  isCompleted?: boolean;
  failures?: number;
}

export interface ArcStatistics {
  totalStorylets: number;
  completedStorylets: number;
  availableStorylets: number;
  totalClues: number;
  discoveredClues: number;
  completionPercentage: number;
  lastAccessed: number;
  timesStarted: number;
  failures: number;
}

export interface ArcHistoryEntry {
  arcId: string;
  arcName: string;
  action: 'started' | 'completed' | 'failed' | 'accessed';
  timestamp: number;
  details?: any;
}

class StoryArcManager {
  private getStores() {
    // Use dynamic imports to avoid circular dependencies
    const narrativeStore = (window as any).useNarrativeStore;
    const socialStore = (window as any).useSocialStore;
    
    if (!narrativeStore || !socialStore) {
      throw new Error('V2 stores not initialized. Make sure to call this after stores are loaded.');
    }
    
    return { narrativeStore, socialStore };
  }

  private getState() {
    const { narrativeStore, socialStore } = this.getStores();
    return {
      narrative: narrativeStore.getState(),
      social: socialStore.getState()
    };
  }

  // ===== ARC OPERATIONS =====

  /**
   * Create a new story arc
   */
  createArc(arcData: CreateArcInput): string {
    const { narrative } = this.getState();
    
    const arcId = narrative.createArc({
      name: arcData.name,
      description: arcData.description,
      progress: arcData.progress || 0,
      isCompleted: arcData.isCompleted || false,
      failures: arcData.failures || 0
    });

    console.log(`✅ Created story arc: ${arcData.name} (${arcId})`);
    return arcId;
  }

  /**
   * Update an existing story arc
   */
  updateArc(arcId: string, updates: Partial<StoryArc>): void {
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    narrative.updateArc(arcId, updates);
    console.log(`✅ Updated story arc: ${arc.name} (${arcId})`);
  }

  /**
   * Delete a story arc and all its relationships
   */
  deleteArc(arcId: string): void {
    const { narrative, social } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    // Remove all clue relationships for this arc
    const arcClues = social.getCluesByArc(arcId);
    arcClues.forEach(clueId => {
      social.removeClueArcRelationship(clueId);
    });

    // Delete the arc itself
    narrative.deleteArc(arcId);
    
    console.log(`✅ Deleted story arc: ${arc.name} (${arcId}) and ${arcClues.length} clue relationships`);
  }

  /**
   * Get a story arc by ID
   */
  getArc(arcId: string): StoryArc | null {
    const { narrative } = this.getState();
    return narrative.getArc(arcId);
  }

  /**
   * Get all story arcs
   */
  getAllArcs(): StoryArc[] {
    const { narrative } = this.getState();
    return narrative.getAllArcs();
  }

  // ===== PROGRESS MANAGEMENT =====

  /**
   * Start a story arc
   */
  startArc(arcId: string): void {
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    narrative.startArc(arcId);
    console.log(`🎬 Started story arc: ${arc.name} (${arcId})`);
  }

  /**
   * Complete a story arc
   */
  completeArc(arcId: string): void {
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    narrative.completeArc(arcId);
    console.log(`🎉 Completed story arc: ${arc.name} (${arcId})`);
  }

  /**
   * Record a failure in a story arc
   */
  recordArcFailure(arcId: string, reason: string): void {
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    narrative.recordArcFailure(arcId, reason);
    console.log(`❌ Recorded failure in story arc: ${arc.name} (${arcId}) - ${reason}`);
  }

  /**
   * Get arc progress details
   */
  getArcProgress(arcId: string): ArcProgress | null {
    const { narrative } = this.getState();
    return narrative.getArcProgress(arcId);
  }

  // ===== STORYLET INTEGRATION =====

  /**
   * Assign a storylet to a story arc
   */
  assignStoryletToArc(storyletId: string, arcId: string): void {
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    narrative.assignStoryletToArc(storyletId, arcId);
    console.log(`🔗 Assigned storylet ${storyletId} to arc: ${arc.name} (${arcId})`);
  }

  /**
   * Get all storylets in an arc
   */
  getArcStorylets(arcId: string): string[] {
    const { narrative } = this.getState();
    return narrative.getArcStorylets(arcId);
  }

  /**
   * Get available storylets for an arc (based on progress)
   */
  getAvailableStorylets(arcId: string): string[] {
    const { narrative } = this.getState();
    const progress = narrative.getArcProgress(arcId);
    return progress?.availableStorylets || [];
  }

  /**
   * Progress a storylet in an arc
   */
  progressArcStorylet(arcId: string, storyletId: string): void {
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    narrative.progressArcStorylet(arcId, storyletId);
    console.log(`⏭️ Progressed storylet ${storyletId} in arc: ${arc.name} (${arcId})`);
  }

  // ===== CLUE INTEGRATION =====

  /**
   * Assign a clue to a story arc with ordering
   */
  assignClueToArc(clueId: string, arcId: string, order: number): void {
    const { narrative, social } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    // Set the clue-arc relationship in social store
    social.setClueArcRelationship(clueId, {
      storyArc: arcId,
      arcOrder: order,
      arcProgress: (order / 10) * 100 // Rough progress estimate
    });

    console.log(`🔗 Assigned clue ${clueId} to arc: ${arc.name} (${arcId}) at order ${order}`);
  }

  /**
   * Get all clues in an arc (ordered)
   */
  getArcClues(arcId: string): string[] {
    const { social } = this.getState();
    return social.getCluesByArc(arcId);
  }

  /**
   * Progress clue discovery in an arc
   */
  progressArcClue(arcId: string, clueId: string): void {
    const { narrative, social } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    social.updateArcDiscoveryProgress(arcId, clueId);
    console.log(`🔍 Progressed clue ${clueId} discovery in arc: ${arc.name} (${arcId})`);
  }

  /**
   * Get the next clue to discover in an arc
   */
  getNextArcClue(arcId: string): string | null {
    const { social } = this.getState();
    return social.getNextClueInArc(arcId);
  }

  // ===== CROSS-ARC OPERATIONS =====

  /**
   * Jump from one arc to another (for branching narratives)
   */
  jumpToArc(fromArcId: string, toArcId: string): void {
    const { narrative } = this.getState();
    const fromArc = narrative.getArc(fromArcId);
    const toArc = narrative.getArc(toArcId);
    
    if (!fromArc || !toArc) {
      throw new Error(`Arc not found: ${fromArcId} or ${toArcId}`);
    }

    // Set flags to indicate the jump
    narrative.setArcFlag(`jumped_from_${fromArcId}`, true);
    narrative.setArcFlag(`jumped_to_${toArcId}`, Date.now());
    
    // Start the target arc if not already started
    if (!toArc.startedAt) {
      this.startArc(toArcId);
    }

    console.log(`🔀 Jumped from arc: ${fromArc.name} to ${toArc.name}`);
  }

  /**
   * Get arcs that depend on this arc's completion
   */
  getArcDependencies(arcId: string): string[] {
    // This would require analyzing clue prerequisites and storylet conditions
    // For now, return empty array as placeholder
    const { narrative } = this.getState();
    const arc = narrative.getArc(arcId);
    
    if (!arc) {
      return [];
    }

    // TODO: Implement dependency analysis
    return [];
  }

  /**
   * Get all arcs that are currently unlocked
   */
  getUnlockedArcs(): string[] {
    const allArcs = this.getAllArcs();
    
    // For now, return all arcs - in future this would check prerequisites
    return allArcs.map(arc => arc.id);
  }

  // ===== STATISTICS & ANALYTICS =====

  /**
   * Get comprehensive statistics for an arc
   */
  getArcStatistics(arcId: string): ArcStatistics {
    const { narrative, social } = this.getState();
    const arc = narrative.getArc(arcId);
    const progress = narrative.getArcProgress(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    const arcClues = social.getCluesByArc(arcId);
    const discoveredClues = social.clues.discovered.filter(clue => 
      arcClues.includes(clue.id)
    ).length;

    return {
      totalStorylets: arc.metadata.totalStorylets,
      completedStorylets: arc.metadata.completedStorylets,
      availableStorylets: progress?.availableStorylets.length || 0,
      totalClues: arcClues.length,
      discoveredClues,
      completionPercentage: arc.progress * 100,
      lastAccessed: arc.metadata.lastAccessed,
      timesStarted: 1, // TODO: Track this properly
      failures: arc.failures
    };
  }

  /**
   * Get player's arc history
   */
  getPlayerArcHistory(): ArcHistoryEntry[] {
    // This would track player's journey through arcs
    // For now, return basic completion data
    const allArcs = this.getAllArcs();
    
    return allArcs
      .filter(arc => arc.startedAt)
      .map(arc => ({
        arcId: arc.id,
        arcName: arc.name,
        action: arc.isCompleted ? 'completed' as const : 'started' as const,
        timestamp: arc.completedAt || arc.startedAt || arc.metadata.createdAt
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get overall arc completion rate
   */
  getArcCompletionRate(): number {
    const allArcs = this.getAllArcs();
    if (allArcs.length === 0) return 0;
    
    const completedArcs = allArcs.filter(arc => arc.isCompleted).length;
    return (completedArcs / allArcs.length) * 100;
  }

  // ===== UTILITY METHODS =====

  /**
   * Initialize arc progress tracking for a new arc
   */
  initializeArcProgress(arcId: string, storyletIds: string[], clueIds: string[]): void {
    const { social } = this.getState();
    
    // Initialize clue discovery progress
    social.initializeArcProgress(arcId, clueIds.length);
    
    // Assign storylets to arc
    storyletIds.forEach(storyletId => {
      this.assignStoryletToArc(storyletId, arcId);
    });
    
    console.log(`🚀 Initialized arc progress for ${arcId}: ${storyletIds.length} storylets, ${clueIds.length} clues`);
  }

  /**
   * Validate arc integrity
   */
  validateArc(arcId: string): { isValid: boolean; issues: string[] } {
    const { narrative, social } = this.getState();
    const arc = narrative.getArc(arcId);
    const issues: string[] = [];
    
    if (!arc) {
      return { isValid: false, issues: ['Arc not found'] };
    }

    // Check for orphaned clues
    const arcClues = social.getCluesByArc(arcId);
    if (arcClues.length === 0) {
      issues.push('No clues assigned to arc');
    }

    // Check for storylets
    const arcStorylets = narrative.getArcStorylets(arcId);
    if (arcStorylets.length === 0) {
      issues.push('No storylets assigned to arc');
    }

    // Check metadata consistency
    if (arc.metadata.totalStorylets !== arcStorylets.length) {
      issues.push('Storylet count mismatch in metadata');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Export arc data for backup/sharing
   */
  exportArc(arcId: string): any {
    const { narrative, social } = this.getState();
    const arc = narrative.getArc(arcId);
    const progress = narrative.getArcProgress(arcId);
    
    if (!arc) {
      throw new Error(`Story arc not found: ${arcId}`);
    }

    const arcClues = social.getCluesByArc(arcId);
    const arcStorylets = narrative.getArcStorylets(arcId);
    const clueRelationships = arcClues.reduce((acc, clueId) => {
      const relationship = social.clues.arcRelationships[clueId];
      if (relationship) {
        acc[clueId] = relationship;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      arc,
      progress,
      clues: arcClues,
      storylets: arcStorylets,
      clueRelationships,
      exportedAt: Date.now()
    };
  }
}

// Create singleton instance
export const storyArcManager = new StoryArcManager();

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).storyArcManager = storyArcManager;
}