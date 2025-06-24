// /Users/montysharma/V11M2/src/utils/minigameValidationTest.ts
// Comprehensive validation test for all minigame plugins

import MinigameRegistry from '../components/minigames/core/MinigameRegistry';
import { registerAllPlugins } from '../components/minigames/plugins';

interface ValidationResult {
  pluginId: string;
  passed: boolean;
  error?: string;
  warnings: string[];
}

interface ValidationSummary {
  totalPlugins: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
  overallPass: boolean;
}

export function validateAllMinigamePlugins(): ValidationSummary {
  console.log('🧪 Starting comprehensive minigame plugin validation...');
  
  const results: ValidationResult[] = [];
  
  // First, try to register all plugins
  try {
    registerAllPlugins();
    console.log('✅ Plugin registration completed without throwing errors');
  } catch (error) {
    console.error('❌ Plugin registration threw an error:', error);
    return {
      totalPlugins: 0,
      passed: 0,
      failed: 1,
      results: [{
        pluginId: 'registration_process',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        warnings: []
      }],
      overallPass: false
    };
  }

  // Get all registered plugins
  const plugins = MinigameRegistry.list();
  console.log(`🔍 Found ${plugins.length} registered plugins`);

  // Validate each plugin individually
  for (const plugin of plugins) {
    const result: ValidationResult = {
      pluginId: plugin.id,
      passed: true,
      warnings: []
    };

    try {
      // Test 1: Basic required properties
      if (!plugin.id) {
        throw new Error('Missing required property: id');
      }
      if (!plugin.name) {
        throw new Error('Missing required property: name');
      }
      if (!plugin.component) {
        throw new Error('Missing required property: component');
      }
      if (!plugin.difficultyConfig) {
        throw new Error('Missing required property: difficultyConfig');
      }

      // Test 2: Difficulty configuration validation
      const requiredLevels = ['easy', 'medium', 'hard'];
      for (const level of requiredLevels) {
        if (!plugin.difficultyConfig[level as keyof typeof plugin.difficultyConfig]) {
          throw new Error(`Missing difficulty configuration for level: ${level}`);
        }
      }

      // Test 3: Custom validation function (if provided)
      if (plugin.validateConfig) {
        const isValid = plugin.validateConfig(plugin);
        if (!isValid) {
          throw new Error('Custom validation function returned false');
        }
      }

      // Test 4: Component type validation
      if (typeof plugin.component !== 'function' && typeof plugin.component !== 'object') {
        result.warnings.push('Component is not a function or React component object');
      }

      // Test 5: Metadata validation
      if (!plugin.category) {
        result.warnings.push('Missing category');
      }
      if (!plugin.description) {
        result.warnings.push('Missing description');
      }
      if (!plugin.estimatedDuration || plugin.estimatedDuration <= 0) {
        result.warnings.push('Invalid or missing estimatedDuration');
      }
      if (!plugin.cognitiveLoad) {
        result.warnings.push('Missing cognitiveLoad');
      }

      // Test 6: Tag validation
      if (!plugin.tags || !Array.isArray(plugin.tags) || plugin.tags.length === 0) {
        result.warnings.push('Missing or empty tags array');
      }

      // Test 7: Help text validation
      if (!plugin.helpText) {
        result.warnings.push('Missing helpText');
      }
      if (!plugin.controls || !Array.isArray(plugin.controls) || plugin.controls.length === 0) {
        result.warnings.push('Missing or empty controls array');
      }

      console.log(`✅ ${plugin.id} passed validation${result.warnings.length > 0 ? ` (${result.warnings.length} warnings)` : ''}`);
      
    } catch (error) {
      result.passed = false;
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${plugin.id} failed validation: ${result.error}`);
    }

    results.push(result);
  }

  // Calculate summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const overallPass = failed === 0;

  const summary: ValidationSummary = {
    totalPlugins: plugins.length,
    passed,
    failed,
    results,
    overallPass
  };

  // Print summary
  console.log('\n📊 Validation Summary:');
  console.log('======================');
  console.log(`Total Plugins: ${summary.totalPlugins}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`Overall: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);

  if (failed > 0) {
    console.log('\n❌ Failed Plugins:');
    results.filter(r => !r.passed).forEach(result => {
      console.log(`  • ${result.pluginId}: ${result.error}`);
    });
  }

  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  if (totalWarnings > 0) {
    console.log(`\n⚠️ Total Warnings: ${totalWarnings}`);
    results.forEach(result => {
      if (result.warnings.length > 0) {
        console.log(`  ${result.pluginId}:`);
        result.warnings.forEach(warning => {
          console.log(`    • ${warning}`);
        });
      }
    });
  }

  return summary;
}

// Quick validation test
export function quickMinigameValidationTest(): boolean {
  try {
    const summary = validateAllMinigamePlugins();
    return summary.overallPass;
  } catch (error) {
    console.error('❌ Quick validation test failed:', error);
    return false;
  }
}

// Test specific plugin
export function validateSinglePlugin(pluginId: string): ValidationResult | null {
  const plugin = MinigameRegistry.get(pluginId);
  if (!plugin) {
    console.error(`❌ Plugin not found: ${pluginId}`);
    return null;
  }

  const result: ValidationResult = {
    pluginId: plugin.id,
    passed: true,
    warnings: []
  };

  try {
    // Re-register the plugin to test validation
    MinigameRegistry.register(plugin);
    console.log(`✅ ${pluginId} validation passed`);
  } catch (error) {
    result.passed = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${pluginId} validation failed: ${result.error}`);
  }

  return result;
}

// Export for console access
declare global {
  interface Window {
    validateAllMinigamePlugins: () => ValidationSummary;
    quickMinigameValidationTest: () => boolean;
    validateSinglePlugin: (pluginId: string) => ValidationResult | null;
  }
}

if (typeof window !== 'undefined') {
  window.validateAllMinigamePlugins = validateAllMinigamePlugins;
  window.quickMinigameValidationTest = quickMinigameValidationTest;
  window.validateSinglePlugin = validateSinglePlugin;
}

export default {
  validateAllMinigamePlugins,
  quickMinigameValidationTest,
  validateSinglePlugin
};