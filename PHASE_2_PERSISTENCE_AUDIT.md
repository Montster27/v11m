# Phase 2: Persistence Implementation Audit

## Overview
This audit maps all persistence implementations in the V11M2 codebase as part of Phase 2 Day 1-2 objectives. The goal is to identify fragmentation and consolidate to a unified system using ContentExportService.

## Current Persistence Implementations

### 1. ContentStudio.tsx `createBackup()`
**Location:** `/src/components/ContentStudio.tsx:147-212`
**Type:** Mixed V2/Legacy backup system
**Storage:** Both IndexedDB (via StorageAdapter) and localStorage fallback

**Key Features:**
- V2 Enhanced backup using ContentExportService
- Automatic fallback to legacy backup on failure
- Retention management (keeps last 5 backups)
- Integration with V2 stores (narrative, social, core)

**Problems Identified:**
- Dual backup system creates complexity
- Manual retention logic duplicated
- Mixed storage adapters (IndexedDB + localStorage)

### 2. useStudioPersistence Hook
**Location:** `/src/components/contentStudio/shared/useStudioPersistence.ts:80-474`
**Type:** Comprehensive persistence framework
**Storage:** Configurable StorageAdapter (auto-selects IndexedDB/localStorage)

**Key Features:**
- Auto-save with debouncing (2s) and intervals (30s)
- Backup management with rotation (max 5)
- Change detection and validation
- Storage adapter abstraction
- Load/save operations with error handling

**Problems Identified:**
- Parallel implementation to ContentExportService
- Custom backup rotation logic
- Different storage key patterns
- Not used consistently across components

### 3. ArcExportImport Component
**Location:** `/src/components/contentStudio/visualEditor/ArcExportImport.tsx:32-113`
**Type:** Visual story arc import/export
**Storage:** File download/manual import (no persistence)

**Key Features:**
- JSON export with metadata validation
- File download capability
- Manual import with validation
- Clipboard integration

**Problems Identified:**
- No persistent storage integration
- Manual file-based workflow only
- Separate from other backup systems
- Limited to story arcs only

### 4. ContentExportService (Target Unified System)
**Location:** `/src/services/ContentExportService.ts:1-500+`
**Type:** Comprehensive export/import service
**Storage:** StorageAdapter abstraction

**Key Features:**
- Multi-format support (JSON, compressed)
- Dependency validation
- Metadata inclusion
- V2 store integration
- Compression algorithms (LZ-String, GZIP-like, JSON-pack)
- Health assessment and monitoring

**Current Usage:**
- Used by ContentStudio.tsx as primary backup method
- Underutilized across other components
- Most comprehensive implementation

## Storage Adapter Analysis

### Current Storage Architecture
1. **StorageFactory** - Auto-selects IndexedDB or localStorage
2. **LocalStorageAdapter** - Direct localStorage implementation
3. **IndexedDBAdapter** - IndexedDB implementation with chunking
4. **StorageMigrationService** - Handles localStorage → IndexedDB migration

### Storage Usage Patterns
- **ContentStudio**: Uses both StorageAdapter and direct localStorage
- **useStudioPersistence**: Uses StorageFactory with auto-selection
- **ArcExportImport**: No persistent storage (file-based only)
- **V2 Stores**: Direct access patterns, not using adapters consistently

## Data Organization Issues

### Current Problems
1. **Multiple Storage Keys:** Different components use different key patterns
   - ContentStudio: `content_backup_v2_${timestamp}`, `content_backup_${timestamp}`
   - useStudioPersistence: `studio_data`, `studio_data_backup_${id}`
   - Stores: Various direct localStorage keys

2. **Inconsistent Retention:** Each system manages its own backup rotation
   - ContentStudio: 5 V2 backups + 5 legacy backups
   - useStudioPersistence: Configurable (default 5)

3. **Storage Limit Fragmentation:** No chunking coordination between systems
   - ContentStudio relies on ContentExportService compression
   - useStudioPersistence has basic size tracking
   - No system-wide storage management

## Store Integration Status

### V2 Stores (Target Architecture)
- **useNarrativeStore**: Has getAllStorylets(), getAllClues() methods
- **useSocialStore**: Clue management and relationships
- **useCoreGameStore**: Player data and world state

### Current Store-Storage Integration
❌ **No Direct Integration**: V2 stores don't use StorageAdapter pattern
❌ **Manual Serialization**: Each persistence system manually accesses store state
❌ **No Hydration Layer**: No consistent restore mechanism

## Consolidation Plan

### Phase 2 Day 3-4: ChunkedStorageAdapter Enhancement
**Goal:** Enhance existing IndexedDB for large datasets

```typescript
// Target: /src/services/storage/ChunkedStorageAdapter.ts
// Wrapper around existing adapters for automatic chunking
class ChunkedStorageAdapter implements StorageAdapter {
  constructor(private baseAdapter: StorageAdapter) {}
  
  async setItem(key: string, value: string): Promise<void> {
    if (value.length > 1MB) {
      // Split into chunks and save with manifest
    } else {
      await this.baseAdapter.setItem(key, value);
    }
  }
}
```

### Phase 2 Day 5-6: Persistence Unification
**Goal:** Migrate all components to use ContentExportService

1. **Remove ContentStudio.tsx local backup** → Use ContentExportService exclusively
2. **Migrate useStudioPersistence features** → Extend ContentExportService with auto-save
3. **Deprecate ArcExportImport** → Use unified export for all content types
4. **Single persistence interface** → All components use ContentExportService

### Phase 2 Day 7: Data Organization Patterns
**Goal:** Implement ContentOrganizer for large collections

```typescript
// Target: /src/services/storage/ContentOrganizer.ts  
class ContentOrganizer {
  async saveStorylets(storylets: Storylet[], adapter: StorageAdapter) {
    // Chunk large collections (50 storylets per chunk)
    // Save manifest with metadata
    // Enable lazy loading
  }
}
```

## Migration Strategy

### Week 2: Store Integration
**Goal:** Connect all stores to storage adapter pattern

```typescript
// Target: /src/stores/integration/StoreStorageSync.ts
class StoreStorageSync {
  constructor(
    private storage: StorageAdapter,
    private stores: Record<string, any>
  ) {}
  
  async syncToStorage() {
    // Unified state serialization
    // Single storage operation
  }
}
```

## Metrics and Validation

### Success Criteria
- ✅ Single ContentExportService handles all persistence
- ✅ No direct localStorage usage in components  
- ✅ All stores use storage adapters
- ✅ Can save/load 50MB+ of content efficiently
- ✅ Consistent backup/restore across app

### Current Storage Capacity
- **localStorage limit**: ~5MB (current bottleneck)
- **IndexedDB capacity**: ~50MB+ (target with chunking)
- **Content size estimate**: 10-20MB for large storylet collections

## Technical Debt Identified

1. **Fragmented Backup Systems**: 4 different implementations
2. **Inconsistent Storage Keys**: No naming convention
3. **Manual Retention Logic**: Duplicated across systems  
4. **Mixed Storage Types**: Some components bypass adapters
5. **No Chunking Coordination**: Each system handles large data differently

## Next Steps (Phase 2 Implementation)

### Day 3-4: ChunkedStorageAdapter
- [ ] Implement transparent chunking wrapper
- [ ] Add to StorageFactory as decorator option
- [ ] Test with 10MB+ storylet collections
- [ ] Integrate with existing ContentExportService

### Day 5-6: Unify to ContentExportService  
- [ ] Remove ContentStudio.tsx local backup code
- [ ] Extend ContentExportService with auto-save capabilities
- [ ] Migrate useStudioPersistence consumers
- [ ] Deprecate ArcExportImport standalone export

### Day 7: ContentOrganizer Implementation
- [ ] Implement chunked collection storage
- [ ] Add lazy loading for large datasets
- [ ] Create indexing for quick lookups
- [ ] Integrate with ContentExportService

This audit provides the foundation for Phase 2's persistence consolidation efforts, identifying clear technical debt and a path toward unified, scalable storage architecture.