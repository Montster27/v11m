// Display formatting utilities for storylet visualization
// Pure functions for formatting condition values and display text

/**
 * Safely formats condition values for display
 * @param value - The value to format (can be any type)
 * @returns Formatted string representation of the value
 */
export function formatConditionValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Handle operator objects like {greater_equal: 5}
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const [operator, operatorValue] = entries[0];
      switch (operator) {
        case 'greater_equal':
          return `≥${operatorValue}`;
        case 'greater_than':
          return `>${operatorValue}`;
        case 'less_equal':
          return `≤${operatorValue}`;
        case 'less_than':
          return `<${operatorValue}`;
        case 'equals':
          return `=${operatorValue}`;
        case 'not_equals':
          return `≠${operatorValue}`;
        case 'min':
          return `min ${operatorValue}`;
        case 'max':
          return `max ${operatorValue}`;
        default:
          return JSON.stringify(value);
      }
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Formats trigger condition summary for display
 * @param trigger - Trigger object with type and conditions
 * @returns Human-readable trigger summary string
 */
export function formatTriggerSummary(trigger: {
  type: string;
  conditions: Record<string, unknown>;
} | null | undefined): string {
  if (!trigger) return 'No trigger';
  
  const { type, conditions } = trigger;
  
  switch (type) {
    case 'time':
      return `Day ${formatConditionValue(conditions?.day || 'unknown')}`;
    case 'flag':
      const flags = conditions?.flags || [];
      return `Requires flags: ${flags.join(', ') || 'none'}`;
    case 'resource':
      if (conditions) {
        const resourceConditions = Object.entries(conditions)
          .map(([key, value]) => `${key}: ${formatConditionValue(value)}`)
          .join(', ');
        return `Resources: ${resourceConditions}`;
      }
      return 'Resource conditions';
    case 'npc_relationship':
      return `NPC: ${conditions?.npcId || 'unknown'}, Level: ${formatConditionValue(conditions?.minLevel || 'unknown')}`;
    case 'npc_availability':
      return `NPC available: ${conditions?.npcId || 'unknown'}`;
    default:
      return `${type} trigger`;
  }
}

/**
 * Formats choice effects for display
 */
export function formatEffectSummary(effects: Array<{
  type: string;
  [key: string]: unknown;
}>): string {
  if (!effects || effects.length === 0) return 'No effects';
  
  const effectSummaries = effects.map(effect => {
    switch (effect.type) {
      case 'resource':
        const sign = effect.delta >= 0 ? '+' : '';
        return `${effect.key} ${sign}${effect.delta}`;
      case 'flag':
        return `Set ${effect.key}: ${effect.value}`;
      case 'skillXp':
        return `${effect.key} +${effect.amount} XP`;
      case 'foundationXp':
        return `${effect.key} foundation +${effect.amount} XP`;
      case 'domainXp':
        return `${effect.domain} +${effect.amount} XP`;
      case 'unlock':
        return `Unlock: ${effect.storyletId}`;
      case 'minigame':
        return `Minigame: ${effect.gameId || effect.minigameType || 'unknown'}`;
      case 'clueDiscovery':
        return `Discover clue: ${effect.clueId}`;
      case 'npcRelationship':
        const relSign = effect.delta >= 0 ? '+' : '';
        return `${effect.npcId} ${relSign}${effect.delta}`;
      case 'npcMemory':
        return `Add memory to ${effect.npcId}`;
      case 'npcFlag':
        return `Set ${effect.npcId}.${effect.flag}: ${effect.value}`;
      case 'npcMood':
        return `${effect.npcId} mood: ${effect.mood}`;
      case 'npcAvailability':
        return `${effect.npcId} availability: ${effect.availability}`;
      default:
        return `${effect.type} effect`;
    }
  });
  
  return effectSummaries.join(', ');
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats storylet name for display with length limit
 */
export function formatStoryletName(name: string, maxLength: number = 25): string {
  const displayName = name || 'Untitled Storylet';
  return truncateText(displayName, maxLength);
}

/**
 * Formats deployment status for display
 */
export function formatDeploymentStatus(status?: string): string {
  switch (status) {
    case 'dev':
      return 'Development';
    case 'stage':
      return 'Staging';
    case 'live':
      return 'Live';
    default:
      return 'Live'; // Default status
  }
}

/**
 * Gets color for deployment status
 */
export function getStatusColor(status?: string): string {
  switch (status) {
    case 'dev':
      return '#ef4444'; // red
    case 'stage':
      return '#f59e0b'; // amber
    case 'live':
      return '#10b981'; // emerald
    default:
      return '#10b981'; // emerald (default)
  }
}

/**
 * Gets color for trigger type
 */
export function getTriggerTypeColor(triggerType?: string): string {
  switch (triggerType) {
    case 'time':
      return '#3b82f6'; // blue
    case 'flag':
      return '#8b5cf6'; // violet
    case 'resource':
      return '#f59e0b'; // amber
    case 'npc_relationship':
      return '#ec4899'; // pink
    case 'npc_availability':
      return '#06b6d4'; // cyan
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Formats node count for display
 */
export function formatNodeCount(count: number, total: number): string {
  if (count === total) {
    return `${count} storylet${count === 1 ? '' : 's'}`;
  }
  return `${count} of ${total} storylet${total === 1 ? '' : 's'}`;
}

/**
 * Formats search results summary
 */
export function formatSearchSummary(
  filteredCount: number,
  totalCount: number,
  searchQuery: string
): string {
  if (!searchQuery) {
    return formatNodeCount(filteredCount, totalCount);
  }
  
  if (filteredCount === 0) {
    return `No results for "${searchQuery}"`;
  }
  
  return `${filteredCount} result${filteredCount === 1 ? '' : 's'} for "${searchQuery}"`;
}

/**
 * Formats validation issue message
 */
export function formatValidationIssue(issue: {
  type: string;
  nodeId: string;
  message: string;
}): string {
  const typeLabels = {
    orphan: '🔗',
    cycle: '🔄',
    missing_connection: '❌',
    missing_flag: '🚩',
    broken_reference: '💔'
  };
  
  const icon = typeLabels[issue.type as keyof typeof typeLabels] || '⚠️';
  return `${icon} ${issue.message}`;
}

/**
 * Formats coordinate for display
 */
export function formatCoordinate(value: number, precision: number = 0): string {
  return value.toFixed(precision);
}

/**
 * Formats zoom level for display
 */
export function formatZoomLevel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formats duration in milliseconds for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}m`;
}