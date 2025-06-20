// Graph Layout Engine for Story Arc Visualization
// Handles node positioning, level assignment, and connection mapping

import { Storylet } from '../types/storylet';

export interface Node {
  id: string;
  storylet: Storylet;
  x: number;
  y: number;
  level: number;
}

export interface Edge {
  from: string;
  to: string;
  choiceText: string;
  choiceId: string;
}

export interface GraphLayout {
  nodes: Node[];
  edges: Edge[];
}

export interface LayoutConfig {
  levelHeight: number;
  nodeSpacing: number;
  canvasWidth: number;
  startX: number;
  startY: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  levelHeight: 160,
  nodeSpacing: 230,
  canvasWidth: 800,
  startX: 50,
  startY: 100
};

/**
 * Finds connections between storylets based on choices and effects
 * @param storylets - Array of storylets to analyze
 * @returns Object containing connection map and edge list
 */
export function findConnections(storylets: Storylet[]): { connections: Map<string, string[]>, edges: Edge[] } {
  const connections = new Map<string, string[]>();
  const edges: Edge[] = [];
  
  // Pre-compute storylet lookups for performance
  const storyletMap = new Map<string, Storylet>();
  const storyletsByTriggerType = new Map<string, Storylet[]>();
  
  storylets.forEach(storylet => {
    storyletMap.set(storylet.id, storylet);
    
    const triggerType = storylet.trigger?.type || 'none';
    if (!storyletsByTriggerType.has(triggerType)) {
      storyletsByTriggerType.set(triggerType, []);
    }
    storyletsByTriggerType.get(triggerType)!.push(storylet);
  });

  // Find connections based on choice effects and direct references
  storylets.forEach(storylet => {
    storylet.choices.forEach(choice => {
      // Find storylets that can be triggered by this choice's effects
      const flagEffects = choice.effects.filter(e => e.type === 'flag' && e.value);
      
      // Only check storylets with flag triggers (optimization)
      const flagTriggeredStorylets = storyletsByTriggerType.get('flag') || [];
      
      flagEffects.forEach(flagEffect => {
        flagTriggeredStorylets.forEach(potentialNext => {
          if (potentialNext.id === storylet.id) return;
          
          const requiredFlags = potentialNext.trigger.conditions.flags || [];
          if (requiredFlags.includes(flagEffect.key)) {
            if (!connections.has(storylet.id)) {
              connections.set(storylet.id, []);
            }
            connections.get(storylet.id)!.push(potentialNext.id);
            
            edges.push({
              from: storylet.id,
              to: potentialNext.id,
              choiceText: choice.text,
              choiceId: choice.id
            });
          }
        });
      });

      // Direct storylet connections
      if (choice.nextStoryletId && storyletMap.has(choice.nextStoryletId)) {
        if (!connections.has(storylet.id)) {
          connections.set(storylet.id, []);
        }
        connections.get(storylet.id)!.push(choice.nextStoryletId);
        
        edges.push({
          from: storylet.id,
          to: choice.nextStoryletId,
          choiceText: choice.text,
          choiceId: choice.id
        });
      }
    });
  });

  return { connections, edges };
}

/**
 * Assigns hierarchical levels to nodes using BFS algorithm
 * @param storylets - Array of all storylets
 * @param connections - Map of storylet connections
 * @param rootIds - Array of root node IDs to start level assignment
 * @returns Map of storylet ID to level number
 */
export function assignLevels(
  storylets: Storylet[],
  connections: Map<string, string[]>,
  rootNodeIds: string[]
): Map<string, number> {
  const levels = new Map<string, number>();
  
  // Early exit if no root nodes
  if (rootNodeIds.length === 0) {
    // If no root nodes, treat all nodes as level 0
    storylets.forEach(storylet => levels.set(storylet.id, 0));
    return levels;
  }

  // BFS to assign levels
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [];
  
  rootNodeIds.forEach(rootId => {
    queue.push({ id: rootId, level: 0 });
    levels.set(rootId, 0);
  });

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const nextIds = connections.get(id) || [];
    nextIds.forEach(nextId => {
      if (!levels.has(nextId) || levels.get(nextId)! < level + 1) {
        levels.set(nextId, level + 1);
        queue.push({ id: nextId, level: level + 1 });
      }
    });
  }

  return levels;
}

/**
 * Groups nodes by their hierarchical level
 */
export function groupNodesByLevel(
  storylets: Storylet[],
  levels: Map<string, number>
): Map<number, string[]> {
  const levelGroups = new Map<number, string[]>();
  
  storylets.forEach(storylet => {
    const level = levels.get(storylet.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(storylet.id);
  });

  return levelGroups;
}

/**
 * Positions nodes within their levels with proper spacing
 */
export function positionNodes(
  storylets: Storylet[],
  levelGroups: Map<number, string[]>,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Node[] {
  const nodeList: Node[] = [];
  const storyletMap = new Map<string, Storylet>();
  storylets.forEach(storylet => storyletMap.set(storylet.id, storylet));

  Array.from(levelGroups.entries()).forEach(([level, storyletIds]) => {
    const levelY = config.startY + level * config.levelHeight;
    const totalWidth = storyletIds.length * config.nodeSpacing;
    const startX = Math.max(config.startX, (config.canvasWidth - totalWidth) / 2);

    storyletIds.forEach((storyletId, index) => {
      const storylet = storyletMap.get(storyletId);
      if (storylet) {
        nodeList.push({
          id: storyletId,
          storylet,
          x: startX + index * config.nodeSpacing,
          y: levelY,
          level
        });
      }
    });
  });

  return nodeList;
}

/**
 * Finds root nodes (nodes with no incoming connections)
 */
export function findRootNodes(storylets: Storylet[], edges: Edge[]): Storylet[] {
  const hasIncoming = new Set<string>();
  edges.forEach(edge => hasIncoming.add(edge.to));
  return storylets.filter(storylet => !hasIncoming.has(storylet.id));
}

/**
 * Main function to calculate complete graph layout
 */
export function calculateGraphLayout(
  storylets: Storylet[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): GraphLayout {
  if (storylets.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Step 1: Find connections and edges
  const { connections, edges } = findConnections(storylets);

  // Step 2: Find root nodes
  const rootNodes = findRootNodes(storylets, edges);

  // Step 3: Assign hierarchical levels
  const levels = assignLevels(storylets, connections, rootNodes.map(n => n.id));

  // Step 4: Group nodes by level
  const levelGroups = groupNodesByLevel(storylets, levels);

  // Step 5: Position nodes
  const nodes = positionNodes(storylets, levelGroups, config);

  return { nodes, edges };
}

/**
 * Validates graph structure and returns issues
 */
export interface GraphValidationIssue {
  type: 'orphan' | 'cycle' | 'missing_connection';
  nodeId: string;
  message: string;
}

export function validateGraphStructure(layout: GraphLayout): GraphValidationIssue[] {
  const issues: GraphValidationIssue[] = [];
  const { nodes, edges } = layout;

  // Find orphaned nodes (no connections)
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  });

  nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && nodes.length > 1) {
      issues.push({
        type: 'orphan',
        nodeId: node.id,
        message: `Node "${node.storylet.name}" has no connections`
      });
    }
  });

  // TODO: Add cycle detection if needed
  // TODO: Add missing connection validation

  return issues;
}