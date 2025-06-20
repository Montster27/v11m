import { describe, test, expect } from 'vitest'
import { 
  calculateGraphLayout, 
  findConnections, 
  findRootNodes, 
  assignLevels,
  positionNodes 
} from '../graphLayout'
import type { Storylet } from '../../types/storylet'

// Mock storylets for testing
const mockStorylets: Storylet[] = [
  {
    id: 'storylet-1',
    name: 'Start Story',
    description: 'The beginning',
    deploymentStatus: 'live',
    choices: [
      {
        id: 'choice-1',
        text: 'Go to next',
        effects: [{ type: 'unlock', storyletId: 'storylet-2' }]
      }
    ]
  },
  {
    id: 'storylet-2',
    name: 'Middle Story',
    description: 'The middle',
    deploymentStatus: 'live',
    choices: [
      {
        id: 'choice-2',
        text: 'Go to end',
        effects: [{ type: 'unlock', storyletId: 'storylet-3' }]
      }
    ]
  },
  {
    id: 'storylet-3',
    name: 'End Story',
    description: 'The end',
    deploymentStatus: 'live',
    choices: [
      {
        id: 'choice-3',
        text: 'Finish',
        effects: []
      }
    ]
  }
]

describe('graphLayout', () => {
  describe('findConnections', () => {
    test('should find connections between storylets', () => {
      const { connections, edges } = findConnections(mockStorylets)
      
      expect(connections.get('storylet-1')).toContain('storylet-2')
      expect(connections.get('storylet-2')).toContain('storylet-3')
      expect(edges).toHaveLength(2)
    })

    test('should handle storylets with no connections', () => {
      const isolatedStorylet: Storylet = {
        id: 'isolated',
        name: 'Isolated',
        description: 'No connections',
        deploymentStatus: 'live',
        choices: []
      }
      
      const { connections } = findConnections([isolatedStorylet])
      expect(connections.get('isolated')).toEqual([])
    })
  })

  describe('findRootNodes', () => {
    test('should identify root nodes correctly', () => {
      const { edges } = findConnections(mockStorylets)
      const rootNodes = findRootNodes(mockStorylets, edges)
      
      expect(rootNodes).toHaveLength(1)
      expect(rootNodes[0].id).toBe('storylet-1')
    })

    test('should handle disconnected components', () => {
      const disconnectedStorylets = [
        ...mockStorylets,
        {
          id: 'disconnected',
          name: 'Disconnected',
          description: 'Not connected',
          deploymentStatus: 'live' as const,
          choices: []
        }
      ]
      
      const { edges } = findConnections(disconnectedStorylets)
      const rootNodes = findRootNodes(disconnectedStorylets, edges)
      
      expect(rootNodes).toHaveLength(2)
    })
  })

  describe('assignLevels', () => {
    test('should assign correct levels to storylets', () => {
      const { connections } = findConnections(mockStorylets)
      const rootIds = ['storylet-1']
      const levels = assignLevels(mockStorylets, connections, rootIds)
      
      expect(levels.get('storylet-1')).toBe(0)
      expect(levels.get('storylet-2')).toBe(1)
      expect(levels.get('storylet-3')).toBe(2)
    })
  })

  describe('calculateGraphLayout', () => {
    test('should create a complete graph layout', () => {
      const layout = calculateGraphLayout(mockStorylets)
      
      expect(layout.nodes).toHaveLength(3)
      expect(layout.edges).toHaveLength(2)
      
      // Check that nodes have required properties
      layout.nodes.forEach(node => {
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('x')
        expect(node).toHaveProperty('y')
        expect(node).toHaveProperty('storylet')
      })
      
      // Check that edges have required properties
      layout.edges.forEach(edge => {
        expect(edge).toHaveProperty('from')
        expect(edge).toHaveProperty('to')
      })
    })

    test('should handle empty storylet array', () => {
      const layout = calculateGraphLayout([])
      
      expect(layout.nodes).toHaveLength(0)
      expect(layout.edges).toHaveLength(0)
    })

    test('should position nodes at increasing y coordinates for sequential storylets', () => {
      const layout = calculateGraphLayout(mockStorylets)
      const sortedNodes = layout.nodes.sort((a, b) => a.y - b.y)
      
      // Nodes should be positioned at increasing y coordinates
      for (let i = 1; i < sortedNodes.length; i++) {
        expect(sortedNodes[i].y).toBeGreaterThan(sortedNodes[i - 1].y)
      }
    })
  })
})