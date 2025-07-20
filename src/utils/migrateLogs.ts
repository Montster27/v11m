// Migration utility to help replace console.log statements with structured logging
// This helps identify and categorize existing console statements for conversion

import { logger } from './logger';

export interface ConsoleUsage {
  file: string;
  line: number;
  method: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  suggestedCategory: string;
  suggestedLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Pattern matching for different types of console statements
const categoryPatterns = {
  'GAME': [
    /game\s*(state|world|day|level|experience|progression)/i,
    /character\s*(creation|update|save|load)/i,
    /skill\s*(gain|xp|advancement)/i,
    /resource\s*(update|calculation)/i
  ],
  'STORE': [
    /store\s*(state|update|persist|hydrat)/i,
    /zustand/i,
    /migration\s*(v2|legacy)/i,
    /save\s*(data|slot|manager)/i
  ],
  'MINIGAME': [
    /minigame\s*(start|complete|result)/i,
    /plugin\s*(register|load)/i,
    /difficulty\s*(adjust|calculate)/i,
    /achievement/i
  ],
  'NARRATIVE': [
    /storylet\s*(evaluat|trigger|complet)/i,
    /flag\s*(set|check|generat)/i,
    /concern\s*(update|calculat)/i,
    /arc\s*(progress|discover)/i,
    /clue\s*(discover|connect)/i
  ],
  'UI': [
    /component\s*(render|mount|update)/i,
    /navigation/i,
    /modal\s*(open|close)/i,
    /notification/i
  ],
  'TEST': [
    /test\s*(run|pass|fail|result)/i,
    /validation/i,
    /benchmark/i,
    /debug\s*(util|tool)/i
  ]
};

const levelPatterns = {
  'error': [
    /error/i,
    /fail/i,
    /exception/i,
    /critical/i,
    /crash/i
  ],
  'warn': [
    /warn/i,
    /deprecated/i,
    /fallback/i,
    /unexpected/i,
    /missing/i
  ],
  'debug': [
    /debug/i,
    /trace/i,
    /verbose/i,
    /detailed/i
  ],
  'info': [] // Default level
};

function categorizeConsoleStatement(message: string): { category: string; level: string } {
  // Determine category
  let category = 'GENERAL';
  for (const [cat, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(pattern => pattern.test(message))) {
      category = cat;
      break;
    }
  }

  // Determine level
  let level = 'info';
  for (const [lvl, patterns] of Object.entries(levelPatterns)) {
    if (patterns.some(pattern => pattern.test(message))) {
      level = lvl;
      break;
    }
  }

  return { category, level };
}

// Helper function to convert console statements
export function convertConsoleStatement(
  method: string,
  message: string,
  data?: any
): string {
  const { category, level } = categorizeConsoleStatement(message);
  
  const categoryMap: Record<string, string> = {
    'GAME': 'logger.game',
    'STORE': 'logger.store',
    'MINIGAME': 'logger.minigame',
    'NARRATIVE': 'logger.narrative',
    'UI': 'logger.ui',
    'TEST': 'logger.test',
    'GENERAL': 'logger'
  };

  const loggerMethod = categoryMap[category] || 'logger';
  const logLevel = method === 'log' ? level : method;

  if (data) {
    return `${loggerMethod}.${logLevel}('${message}', ${JSON.stringify(data)});`;
  } else {
    return `${loggerMethod}.${logLevel}('${message}');`;
  }
}

// Scan for console usage patterns (for development analysis)
export function analyzeConsoleUsage(): {
  totalCount: number;
  methodCounts: Record<string, number>;
  categorySuggestions: Record<string, number>;
  suggestions: string[];
} {
  const methodCounts: Record<string, number> = {};
  const categorySuggestions: Record<string, number> = {};
  const suggestions: string[] = [];

  // This would need to be implemented with file system scanning in a build tool
  // For now, provide guidance for manual migration

  suggestions.push('1. Import logger: import { logger } from "./utils/logger";');
  suggestions.push('2. Replace console.log with appropriate category:');
  suggestions.push('   - Game logic: logger.game.info("message")');
  suggestions.push('   - Store operations: logger.store.debug("message")');
  suggestions.push('   - Minigames: logger.minigame.info("message")');
  suggestions.push('   - Narrative: logger.narrative.debug("message")');
  suggestions.push('   - UI components: logger.ui.debug("message")');
  suggestions.push('   - Tests: logger.test.info("message")');
  suggestions.push('3. Use appropriate log levels:');
  suggestions.push('   - debug: Detailed debugging information');
  suggestions.push('   - info: General information');
  suggestions.push('   - warn: Warning conditions');
  suggestions.push('   - error: Error conditions');

  return {
    totalCount: 0,
    methodCounts,
    categorySuggestions,
    suggestions
  };
}

// Example conversions for common patterns
export const conversionExamples = [
  {
    before: "console.log('🚀 App startup - Current state:', { day, userLevel });",
    after: "logger.game.info('App startup - Current state', { day, userLevel });"
  },
  {
    before: "console.log('🔄 Initializing V2 stores...');",
    after: "logger.store.info('Initializing V2 stores');"
  },
  {
    before: "console.error('❌ Save failed:', error);",
    after: "logger.store.error('Save failed', error);"
  },
  {
    before: "console.log('🎮 Minigame completed:', result);",
    after: "logger.minigame.info('Minigame completed', result);"
  },
  {
    before: "console.log('🏷️ Flag generated:', flagName);",
    after: "logger.narrative.debug('Flag generated', { flagName });"
  },
  {
    before: "console.warn('⚠️ Component rendered without data');",
    after: "logger.ui.warn('Component rendered without data');"
  }
];

// Expose migration tools globally for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).migrateLogs = {
    convertConsoleStatement,
    analyzeConsoleUsage,
    conversionExamples
  };
  
  logger.info('DEV_TOOLS', 'Log migration tools available: window.migrateLogs');
}

export default {
  convertConsoleStatement,
  analyzeConsoleUsage,
  conversionExamples
};