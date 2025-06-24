// /Users/montysharma/V11M2/src/components/minigames/plugins/index.ts
// Plugin registration and exports

import MinigameRegistry from '../core/MinigameRegistry';

// Import all plugins
import { memoryCardPlugin } from './MemoryCardPlugin';
import { wordScramblePlugin } from './WordScramblePlugin';
import { colorMatchPlugin } from './ColorMatchPlugin';
import { stroopTestPlugin } from './StroopTestPlugin';
import { pathPlannerPlugin } from './PathPlannerPlugin';
import { patternSequencePlugin } from './PatternSequencePlugin';
import { mathQuizPlugin } from './MathQuizPlugin';
import { reactionTimePlugin } from './ReactionTimePlugin';
import { logicPuzzlePlugin } from './LogicPuzzlePlugin';
import { typingTestPlugin } from './TypingTestPlugin';
import { wordAssociationPlugin } from './WordAssociationPlugin';

// Register all plugins with the registry
export function registerAllPlugins() {
  try {
    console.log('🔌 Registering all minigame plugins...');
    
    // Register existing migrated plugins
    MinigameRegistry.register(memoryCardPlugin);
    MinigameRegistry.register(wordScramblePlugin);
    MinigameRegistry.register(colorMatchPlugin);
    MinigameRegistry.register(stroopTestPlugin);
    MinigameRegistry.register(pathPlannerPlugin);
    
    // Register new placeholder games
    MinigameRegistry.register(patternSequencePlugin);
    MinigameRegistry.register(mathQuizPlugin);
    MinigameRegistry.register(reactionTimePlugin);
    MinigameRegistry.register(logicPuzzlePlugin);
    MinigameRegistry.register(typingTestPlugin);
    MinigameRegistry.register(wordAssociationPlugin);
    
    console.log('✅ All minigame plugins registered successfully');
    
    // Log registry stats
    const stats = MinigameRegistry.getRegistryStats();
    console.log('📊 Registry Stats:', stats);
    
  } catch (error) {
    console.error('❌ Error registering plugins:', error);
  }
}

// Auto-register plugins when this module is imported
registerAllPlugins();

// Export individual plugins for direct use if needed
export {
  memoryCardPlugin,
  wordScramblePlugin,
  colorMatchPlugin,
  stroopTestPlugin,
  pathPlannerPlugin,
  patternSequencePlugin,
  mathQuizPlugin,
  reactionTimePlugin,
  logicPuzzlePlugin,
  typingTestPlugin,
  wordAssociationPlugin
};

// Export registry for external use
export { default as MinigameRegistry } from '../core/MinigameRegistry';