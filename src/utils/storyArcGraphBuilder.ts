// /Users/montysharma/V11M2/src/utils/storyArcGraphBuilder.ts
// Extracted graph building logic from StoryArcVisualizer

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

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export class StoryArcGraphBuilder {
  static buildGraph(storylets: Storylet[]): GraphData {
    if (storylets.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Build the graph structure
    const storyletMap = new Map<string, Storylet>();
    storylets.forEach(storylet => storyletMap.set(storylet.id, storylet));

    // Find connections between storylets
    const connections = new Map<string, string[]>();
    const edgeList: Edge[] = [];

    storylets.forEach(storylet => {
      storylet.choices.forEach(choice => {
        // Find storylets that can be triggered by this choice's effects
        const flagEffects = choice.effects.filter(e => e.type === 'flag' && e.value);
        
        flagEffects.forEach(flagEffect => {
          storylets.forEach(potentialNext => {
            if (potentialNext.id === storylet.id) return;
            
            if (potentialNext.trigger.type === 'flag') {
              const requiredFlags = potentialNext.trigger.conditions.flags || [];
              if (requiredFlags.includes(flagEffect.key)) {
                this.addConnection(connections, storylet.id, potentialNext.id);
                
                edgeList.push({
                  from: storylet.id,
                  to: potentialNext.id,
                  choiceText: choice.text,
                  choiceId: choice.id
                });
              }
            }
          });
        });

        // Direct storylet connections
        if (choice.nextStoryletId && storyletMap.has(choice.nextStoryletId)) {
          this.addConnection(connections, storylet.id, choice.nextStoryletId);
          
          edgeList.push({
            from: storylet.id,
            to: choice.nextStoryletId,
            choiceText: choice.text,
            choiceId: choice.id
          });
        }
      });
    });

    // Find root nodes (no incoming connections)
    const hasIncoming = new Set<string>();
    edgeList.forEach(edge => hasIncoming.add(edge.to));
    const rootNodes = storylets.filter(storylet => !hasIncoming.has(storylet.id));

    // Layout nodes using hierarchical layout
    const nodeList = this.layoutNodes(storylets, connections, rootNodes);

    return { nodes: nodeList, edges: edgeList };
  }

  private static addConnection(connections: Map<string, string[]>, from: string, to: string) {
    if (!connections.has(from)) {
      connections.set(from, []);
    }
    connections.get(from)!.push(to);
  }

  private static layoutNodes(
    storylets: Storylet[], 
    connections: Map<string, string[]>, 
    rootNodes: Storylet[]
  ): Node[] {
    const nodeList: Node[] = [];
    const visited = new Set<string>();
    const levels = new Map<string, number>();

    // BFS to assign levels
    const queue: { id: string; level: number }[] = [];
    rootNodes.forEach(root => {
      queue.push({ id: root.id, level: 0 });
      levels.set(root.id, 0);
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

    // Group nodes by level for positioning
    const levelGroups = new Map<number, string[]>();
    storylets.forEach(storylet => {
      const level = levels.get(storylet.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(storylet.id);
    });

    // Position nodes
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelHeight = 150;
    const nodeSpacing = 250;

    const storyletMap = new Map<string, Storylet>();
    storylets.forEach(storylet => storyletMap.set(storylet.id, storylet));

    Array.from(levelGroups.entries()).forEach(([level, storyletIds]) => {
      const levelY = 100 + level * levelHeight;
      const totalWidth = storyletIds.length * nodeSpacing;
      const startX = Math.max(50, (800 - totalWidth) / 2);

      storyletIds.forEach((storyletId, index) => {
        const storylet = storyletMap.get(storyletId)!;
        nodeList.push({
          id: storyletId,
          storylet,
          x: startX + index * nodeSpacing,
          y: levelY,
          level
        });
      });
    });

    return nodeList;
  }
}

export const getNodeColor = (node: Node, selectedNode: string | null, highlightedPath: string[]) => {
  if (node.id === selectedNode) return '#3b82f6'; // blue-500
  if (highlightedPath.includes(node.id)) return '#10b981'; // emerald-500
  
  // Color by trigger type
  switch (node.storylet.trigger.type) {
    case 'time': return '#6b7280'; // gray-500
    case 'flag': return '#8b5cf6'; // violet-500
    case 'resource': return '#f59e0b'; // amber-500
    default: return '#6b7280';
  }
};

export const isEdgeHighlighted = (edge: Edge, highlightedPath: string[]) => {
  return highlightedPath.includes(edge.from) && highlightedPath.includes(edge.to);
};