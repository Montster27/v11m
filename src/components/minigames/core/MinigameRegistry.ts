// /Users/montysharma/V11M2/src/components/minigames/core/MinigameRegistry.ts
// Plugin registration and discovery system for minigames

import { MinigamePlugin, MinigameRegistry as IMinigameRegistry } from './types';

class MinigameRegistryImpl implements IMinigameRegistry {
  public plugins: Map<string, MinigamePlugin> = new Map();

  constructor() {
    console.log('🎮 MinigameRegistry initialized');
  }

  register(plugin: MinigamePlugin): void {
    // Validate plugin before registration
    if (!plugin.id) {
      throw new Error('Plugin must have an id');
    }
    
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }
    
    if (!plugin.component) {
      throw new Error('Plugin must have a component');
    }

    if (!plugin.difficultyConfig) {
      throw new Error('Plugin must have difficulty configuration');
    }

    // Validate difficulty config has required levels
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      if (!plugin.difficultyConfig[level as keyof typeof plugin.difficultyConfig]) {
        throw new Error(`Plugin must have ${level} difficulty configuration`);
      }
    }

    // Custom validation if provided
    if (plugin.validateConfig) {
      const isValid = plugin.validateConfig(plugin);
      if (!isValid) {
        throw new Error(`Plugin ${plugin.id} failed custom validation`);
      }
    }

    // Check for conflicts
    if (this.plugins.has(plugin.id)) {
      console.warn(`⚠️ Overriding existing plugin: ${plugin.id}`);
    }

    this.plugins.set(plugin.id, plugin);
    console.log(`✅ Registered minigame plugin: ${plugin.id} (${plugin.name})`);
  }

  unregister(id: string): void {
    if (this.plugins.has(id)) {
      this.plugins.delete(id);
      console.log(`🗑️ Unregistered minigame plugin: ${id}`);
    } else {
      console.warn(`⚠️ Attempted to unregister non-existent plugin: ${id}`);
    }
  }

  get(id: string): MinigamePlugin | undefined {
    return this.plugins.get(id);
  }

  list(): MinigamePlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  listByCategory(category: string): MinigamePlugin[] {
    return this.list().filter(plugin => plugin.category === category);
  }

  search(query: string): MinigamePlugin[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(plugin => 
      plugin.name.toLowerCase().includes(lowerQuery) ||
      plugin.description.toLowerCase().includes(lowerQuery) ||
      plugin.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      plugin.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Additional utility methods
  getRandomGame(category?: string): MinigamePlugin | undefined {
    const games = category ? this.listByCategory(category) : this.list();
    if (games.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
  }

  getGamesByDuration(maxSeconds: number): MinigamePlugin[] {
    return this.list().filter(plugin => plugin.estimatedDuration <= maxSeconds);
  }

  getGamesBySkill(skill: string): MinigamePlugin[] {
    return this.list().filter(plugin => 
      plugin.requiredSkills?.includes(skill)
    );
  }

  getGamesByCognitiveLoad(load: 'low' | 'medium' | 'high'): MinigamePlugin[] {
    return this.list().filter(plugin => plugin.cognitiveLoad === load);
  }

  // Statistics and analytics
  getRegistryStats() {
    const games = this.list();
    const categories = new Set(games.map(g => g.category));
    const avgDuration = games.reduce((sum, g) => sum + g.estimatedDuration, 0) / games.length;
    
    return {
      totalGames: games.length,
      categories: Array.from(categories),
      averageDuration: Math.round(avgDuration),
      cognitiveLoads: {
        low: games.filter(g => g.cognitiveLoad === 'low').length,
        medium: games.filter(g => g.cognitiveLoad === 'medium').length,
        high: games.filter(g => g.cognitiveLoad === 'high').length
      }
    };
  }

  // Development helpers
  validateAllPlugins(): { valid: string[]; invalid: Array<{ id: string; error: string }> } {
    const valid: string[] = [];
    const invalid: Array<{ id: string; error: string }> = [];

    for (const [id, plugin] of this.plugins) {
      try {
        // Re-validate each plugin
        this.register({ ...plugin }); // This will throw if invalid
        valid.push(id);
      } catch (error) {
        invalid.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { valid, invalid };
  }

  // Plugin hot-reloading support (for development)
  hotReload(id: string, newPlugin: MinigamePlugin): void {
    if (this.plugins.has(id)) {
      console.log(`🔄 Hot-reloading plugin: ${id}`);
      this.unregister(id);
      this.register(newPlugin);
    } else {
      console.warn(`⚠️ Cannot hot-reload non-existent plugin: ${id}`);
    }
  }
}

// Singleton instance
const registry = new MinigameRegistryImpl();

// Export both the instance and the class for testing
export default registry;
export { MinigameRegistryImpl };