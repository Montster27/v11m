// Custom hook for storylet filtering and search functionality
// Provides optimized search index and filtering capabilities

import { useMemo } from 'react';
import { Storylet, StoryletDeploymentStatus } from '../types/storylet';

export interface SearchIndex {
  name: string;
  description: string;
  flags: string[];
  choices: string[];
  triggerType: string;
  deploymentStatus: StoryletDeploymentStatus;
}

export interface FilterOptions {
  searchQuery: string;
  triggerType: string;
  status: string;
}

export interface StoryletFilterHook {
  filteredStorylets: Storylet[];
  searchIndex: Map<string, SearchIndex>;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}

/**
 * Custom hook for filtering storylets with optimized search
 */
export function useStoryletFilter(
  storylets: Storylet[],
  filters: FilterOptions
): StoryletFilterHook {
  const { searchQuery, triggerType, status } = filters;

  // Memoized search index for performance
  const searchIndex = useMemo(() => {
    const index = new Map<string, SearchIndex>();
    
    storylets.forEach(storylet => {
      index.set(storylet.id, {
        name: storylet.name?.toLowerCase() || '',
        description: storylet.description?.toLowerCase() || '',
        flags: storylet.trigger?.conditions?.flags?.map(f => f.toLowerCase()) || [],
        choices: storylet.choices?.map(c => c.text.toLowerCase()) || [],
        triggerType: storylet.trigger?.type || 'none',
        deploymentStatus: storylet.deploymentStatus || 'live'
      });
    });
    
    return index;
  }, [storylets]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(searchQuery || triggerType !== 'all' || status !== 'all');
  }, [searchQuery, triggerType, status]);

  // Memoized filtered storylets with optimized search
  const filteredStorylets = useMemo(() => {
    if (!hasActiveFilters) {
      return storylets; // No filtering needed
    }
    
    return storylets.filter(storylet => {
      const searchData = searchIndex.get(storylet.id);
      if (!searchData) return false;

      // Search query filter with pre-computed index
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        const matchesName = searchData.name.includes(query);
        const matchesDescription = searchData.description.includes(query);
        const matchesFlags = searchData.flags.some(flag => flag.includes(query));
        const matchesChoices = searchData.choices.some(choice => choice.includes(query));
        
        if (!matchesName && !matchesDescription && !matchesFlags && !matchesChoices) {
          return false;
        }
      }
      
      // Trigger type filter
      if (triggerType !== 'all' && searchData.triggerType !== triggerType) {
        return false;
      }
      
      // Status filter
      if (status !== 'all' && searchData.deploymentStatus !== status) {
        return false;
      }
      
      return true;
    });
  }, [storylets, searchIndex, searchQuery, triggerType, status, hasActiveFilters]);

  return {
    filteredStorylets,
    searchIndex,
    totalCount: storylets.length,
    filteredCount: filteredStorylets.length,
    hasActiveFilters
  };
}

/**
 * Utility function to search storylets by text across multiple fields
 */
export function searchStorylets(
  storylets: Storylet[],
  query: string,
  searchIndex?: Map<string, SearchIndex>
): Storylet[] {
  if (!query.trim()) return storylets;
  
  const lowerQuery = query.toLowerCase();
  
  return storylets.filter(storylet => {
    // Use pre-computed index if available
    if (searchIndex) {
      const searchData = searchIndex.get(storylet.id);
      if (searchData) {
        return (
          searchData.name.includes(lowerQuery) ||
          searchData.description.includes(lowerQuery) ||
          searchData.flags.some(flag => flag.includes(lowerQuery)) ||
          searchData.choices.some(choice => choice.includes(lowerQuery))
        );
      }
    }
    
    // Fallback to direct search
    const matchesName = storylet.name?.toLowerCase().includes(lowerQuery);
    const matchesDescription = storylet.description?.toLowerCase().includes(lowerQuery);
    const matchesFlags = storylet.trigger?.conditions?.flags?.some(flag => 
      flag.toLowerCase().includes(lowerQuery)
    );
    const matchesChoices = storylet.choices?.some(choice => 
      choice.text.toLowerCase().includes(lowerQuery)
    );
    
    return matchesName || matchesDescription || matchesFlags || matchesChoices;
  });
}

/**
 * Utility function to filter storylets by trigger type
 */
export function filterByTriggerType(
  storylets: Storylet[],
  triggerType: string
): Storylet[] {
  if (triggerType === 'all') return storylets;
  
  return storylets.filter(storylet => storylet.trigger?.type === triggerType);
}

/**
 * Utility function to filter storylets by deployment status
 */
export function filterByStatus(
  storylets: Storylet[],
  status: string
): Storylet[] {
  if (status === 'all') return storylets;
  
  return storylets.filter(storylet => storylet.deploymentStatus === status);
}

/**
 * Get available trigger types from a set of storylets
 */
export function getAvailableTriggerTypes(storylets: Storylet[]): string[] {
  const types = new Set<string>();
  storylets.forEach(storylet => {
    types.add(storylet.trigger?.type || 'none');
  });
  return Array.from(types).sort();
}

/**
 * Get available deployment statuses from a set of storylets
 */
export function getAvailableStatuses(storylets: Storylet[]): StoryletDeploymentStatus[] {
  const statuses = new Set<StoryletDeploymentStatus>();
  storylets.forEach(storylet => {
    statuses.add(storylet.deploymentStatus || 'live');
  });
  return Array.from(statuses).sort();
}

/**
 * Get filter statistics for display
 */
export interface FilterStats {
  total: number;
  filtered: number;
  byTriggerType: Record<string, number>;
  byStatus: Record<string, number>;
  searchResults: number;
}

export function getFilterStats(
  allStorylets: Storylet[],
  filteredStorylets: Storylet[],
  searchQuery: string
): FilterStats {
  const byTriggerType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  // Count by trigger type
  allStorylets.forEach(storylet => {
    const type = storylet.trigger?.type || 'none';
    byTriggerType[type] = (byTriggerType[type] || 0) + 1;
  });
  
  // Count by status
  allStorylets.forEach(storylet => {
    const status = storylet.deploymentStatus || 'live';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  
  return {
    total: allStorylets.length,
    filtered: filteredStorylets.length,
    byTriggerType,
    byStatus,
    searchResults: searchQuery ? filteredStorylets.length : allStorylets.length
  };
}