// Enhanced Progress Tracking System for Phase 5
// Provides detailed progress monitoring with real-time updates

export interface ProgressStage {
  id: string;
  name: string;
  weight: number; // Relative weight for overall progress calculation
  estimatedDuration?: number; // ms
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
  error?: string;
  substages?: ProgressStage[];
}

export interface ProgressUpdate {
  overallProgress: number;
  currentStage: ProgressStage;
  totalStages: number;
  completedStages: number;
  estimatedTimeRemaining?: number;
  elapsedTime: number;
  throughput?: {
    itemsPerSecond: number;
    bytesPerSecond?: number;
  };
}

export interface ProgressOptions {
  onUpdate?: (update: ProgressUpdate) => void;
  onStageStart?: (stage: ProgressStage) => void;
  onStageComplete?: (stage: ProgressStage) => void;
  onError?: (stage: ProgressStage, error: string) => void;
  updateInterval?: number; // ms
  enableThroughputTracking?: boolean;
  enableTimeEstimation?: boolean;
}

export class ProgressTracker {
  private stages: ProgressStage[] = [];
  private currentStageIndex = -1;
  private startTime = 0;
  private options: ProgressOptions;
  private updateTimer?: NodeJS.Timeout;
  private throughputData: { timestamp: number; items: number; bytes?: number }[] = [];

  constructor(stages: Omit<ProgressStage, 'status' | 'progress'>[], options: ProgressOptions = {}) {
    this.stages = stages.map(stage => ({
      ...stage,
      status: 'pending',
      progress: 0
    }));
    
    this.options = {
      updateInterval: 100,
      enableThroughputTracking: true,
      enableTimeEstimation: true,
      ...options
    };
  }

  /**
   * Start progress tracking
   */
  start(): void {
    this.startTime = Date.now();
    this.throughputData = [];
    
    if (this.options.updateInterval && this.options.onUpdate) {
      this.updateTimer = setInterval(() => {
        this.emitUpdate();
      }, this.options.updateInterval);
    }

    console.log('📈 Progress tracking started with', this.stages.length, 'stages');
  }

  /**
   * Start a specific stage
   */
  startStage(stageId: string): void {
    const stageIndex = this.stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) {
      throw new Error(`Stage not found: ${stageId}`);
    }

    // Complete previous stage if it was active
    if (this.currentStageIndex >= 0 && this.currentStageIndex < stageIndex) {
      this.completeStage(this.stages[this.currentStageIndex].id);
    }

    this.currentStageIndex = stageIndex;
    const stage = this.stages[stageIndex];
    
    stage.status = 'active';
    stage.startTime = Date.now();
    stage.progress = 0;

    console.log(`📋 Starting stage: ${stage.name}`);
    
    if (this.options.onStageStart) {
      this.options.onStageStart(stage);
    }
    
    this.emitUpdate();
  }

  /**
   * Update progress for current stage
   */
  updateStage(stageId: string, progress: number, substageInfo?: { name: string; progress: number }): void {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) {
      console.warn(`Stage not found for update: ${stageId}`);
      return;
    }

    stage.progress = Math.max(0, Math.min(100, progress));

    // Update substage if provided
    if (substageInfo && stage.substages) {
      const substage = stage.substages.find(s => s.name === substageInfo.name);
      if (substage) {
        substage.progress = substageInfo.progress;
      }
    }

    this.emitUpdate();
  }

  /**
   * Complete a stage
   */
  completeStage(stageId: string): void {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) {
      console.warn(`Stage not found for completion: ${stageId}`);
      return;
    }

    stage.status = 'completed';
    stage.progress = 100;
    stage.endTime = Date.now();

    console.log(`✅ Completed stage: ${stage.name} (${stage.endTime! - stage.startTime!}ms)`);

    if (this.options.onStageComplete) {
      this.options.onStageComplete(stage);
    }

    this.emitUpdate();
  }

  /**
   * Mark stage as failed
   */
  failStage(stageId: string, error: string): void {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) {
      console.warn(`Stage not found for failure: ${stageId}`);
      return;
    }

    stage.status = 'failed';
    stage.endTime = Date.now();
    stage.error = error;

    console.error(`❌ Failed stage: ${stage.name} - ${error}`);

    if (this.options.onError) {
      this.options.onError(stage, error);
    }

    this.emitUpdate();
  }

  /**
   * Record throughput data for estimation
   */
  recordThroughput(items: number, bytes?: number): void {
    if (!this.options.enableThroughputTracking) return;

    this.throughputData.push({
      timestamp: Date.now(),
      items,
      bytes
    });

    // Keep only recent data (last 10 seconds)
    const cutoff = Date.now() - 10000;
    this.throughputData = this.throughputData.filter(data => data.timestamp > cutoff);
  }

  /**
   * Complete all tracking
   */
  complete(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    // Mark any remaining stages as completed
    this.stages.forEach(stage => {
      if (stage.status === 'active') {
        stage.status = 'completed';
        stage.progress = 100;
        stage.endTime = Date.now();
      }
    });

    const totalTime = Date.now() - this.startTime;
    console.log(`🏁 Progress tracking completed in ${totalTime}ms`);

    this.emitUpdate();
  }

  /**
   * Get current progress state
   */
  getProgress(): ProgressUpdate {
    const completedStages = this.stages.filter(s => s.status === 'completed').length;
    const currentStage = this.stages[this.currentStageIndex] || this.stages[0];
    const elapsedTime = Date.now() - this.startTime;

    // Calculate overall progress based on stage weights
    let overallProgress = 0;
    let totalWeight = 0;

    this.stages.forEach(stage => {
      totalWeight += stage.weight;
      if (stage.status === 'completed') {
        overallProgress += stage.weight;
      } else if (stage.status === 'active') {
        overallProgress += (stage.progress / 100) * stage.weight;
      }
    });

    overallProgress = totalWeight > 0 ? (overallProgress / totalWeight) * 100 : 0;

    const update: ProgressUpdate = {
      overallProgress: Math.min(100, overallProgress),
      currentStage,
      totalStages: this.stages.length,
      completedStages,
      elapsedTime
    };

    // Add time estimation if enabled
    if (this.options.enableTimeEstimation && overallProgress > 5) {
      const progressRate = overallProgress / elapsedTime; // progress per ms
      const remainingProgress = 100 - overallProgress;
      update.estimatedTimeRemaining = remainingProgress / progressRate;
    }

    // Add throughput if enabled and available
    if (this.options.enableThroughputTracking && this.throughputData.length > 1) {
      const throughput = this.calculateThroughput();
      if (throughput) {
        update.throughput = throughput;
      }
    }

    return update;
  }

  /**
   * Reset progress tracking
   */
  reset(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    this.stages.forEach(stage => {
      stage.status = 'pending';
      stage.progress = 0;
      stage.startTime = undefined;
      stage.endTime = undefined;
      stage.error = undefined;
    });

    this.currentStageIndex = -1;
    this.throughputData = [];
  }

  /**
   * Add a new stage dynamically
   */
  addStage(stage: Omit<ProgressStage, 'status' | 'progress'>): void {
    this.stages.push({
      ...stage,
      status: 'pending',
      progress: 0
    });
  }

  /**
   * Get stage by ID
   */
  getStage(stageId: string): ProgressStage | undefined {
    return this.stages.find(s => s.id === stageId);
  }

  // Private methods
  private emitUpdate(): void {
    if (this.options.onUpdate) {
      this.options.onUpdate(this.getProgress());
    }
  }

  private calculateThroughput(): { itemsPerSecond: number; bytesPerSecond?: number } | null {
    if (this.throughputData.length < 2) return null;

    const recent = this.throughputData.slice(-5); // Last 5 data points
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    
    if (timeSpan <= 0) return null;

    const totalItems = recent.reduce((sum, data) => sum + data.items, 0);
    const totalBytes = recent.every(data => data.bytes !== undefined) 
      ? recent.reduce((sum, data) => sum + (data.bytes || 0), 0)
      : undefined;

    const itemsPerSecond = (totalItems / timeSpan) * 1000;
    const bytesPerSecond = totalBytes ? (totalBytes / timeSpan) * 1000 : undefined;

    return {
      itemsPerSecond,
      bytesPerSecond
    };
  }
}

// Utility functions for common progress patterns
export function createExportProgressStages(): Omit<ProgressStage, 'status' | 'progress'>[] {
  return [
    { id: 'init', name: 'Initializing export', weight: 5, estimatedDuration: 500 },
    { id: 'gather', name: 'Gathering content', weight: 25, estimatedDuration: 2000 },
    { id: 'validate', name: 'Validating data', weight: 15, estimatedDuration: 1000 },
    { id: 'package', name: 'Creating package', weight: 20, estimatedDuration: 1500 },
    { id: 'compress', name: 'Compressing data', weight: 30, estimatedDuration: 3000 },
    { id: 'finalize', name: 'Finalizing export', weight: 5, estimatedDuration: 500 }
  ];
}

export function createImportProgressStages(): Omit<ProgressStage, 'status' | 'progress'>[] {
  return [
    { id: 'init', name: 'Initializing import', weight: 5, estimatedDuration: 300 },
    { id: 'validate', name: 'Validating package', weight: 10, estimatedDuration: 800 },
    { id: 'decompress', name: 'Decompressing data', weight: 20, estimatedDuration: 2000 },
    { id: 'process', name: 'Processing content', weight: 50, estimatedDuration: 4000 },
    { id: 'store', name: 'Storing data', weight: 10, estimatedDuration: 1000 },
    { id: 'finalize', name: 'Finalizing import', weight: 5, estimatedDuration: 200 }
  ];
}

export function createMigrationProgressStages(): Omit<ProgressStage, 'status' | 'progress'>[] {
  return [
    { id: 'backup', name: 'Creating backup', weight: 10, estimatedDuration: 1000 },
    { id: 'analyze', name: 'Analyzing data', weight: 15, estimatedDuration: 1500 },
    { id: 'migrate', name: 'Migrating content', weight: 60, estimatedDuration: 5000 },
    { id: 'verify', name: 'Verifying migration', weight: 10, estimatedDuration: 1000 },
    { id: 'cleanup', name: 'Cleaning up', weight: 5, estimatedDuration: 500 }
  ];
}