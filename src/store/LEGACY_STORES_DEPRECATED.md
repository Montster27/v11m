# Legacy Stores Deprecated - V2 Migration Complete

⚠️ **WARNING: These legacy stores are deprecated and will be removed in a future version**

## Migration Status: Phase 4 Complete

All legacy stores in this directory have been superseded by the V2 unified store architecture located in `/src/stores/v2/`.

## Deprecated Stores

- `useStoryletCatalogStore.ts` → Use `useNarrativeStore` from `/stores/v2/`
- `useStoryletStore.ts` → Use `useNarrativeStore` from `/stores/v2/`
- `useNPCStore.ts` → Use `useSocialStore` from `/stores/v2/`
- `useClueStore.ts` → Use `useNarrativeStore` from `/stores/v2/`
- `useStoryArcStore.ts` → Use `useNarrativeStore` from `/stores/v2/`

## Migration Guide

### Before (Legacy):
```typescript
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';
import { useNPCStore } from '../store/useNPCStore';
import { useClueStore } from '../store/useClueStore';

const catalogStore = useStoryletCatalogStore();
const npcStore = useNPCStore();
const clueStore = useClueStore();

const storylets = catalogStore.allStorylets;
const npcs = Object.values(npcStore.npcs);
const clues = Object.values(clueStore.clues);
```

### After (V2):
```typescript
import { useNarrativeStore, useSocialStore } from '../stores/v2';

const narrativeStore = useNarrativeStore();
const socialStore = useSocialStore();

const storylets = narrativeStore.getStorylets();
const npcs = socialStore.getAllNPCs();
const clues = narrativeStore.getClues();
```

## Benefits of V2 Stores

1. **Unified Architecture**: Single source of truth for related data
2. **Better Performance**: Optimized with selectors and memoization
3. **Type Safety**: Full TypeScript support with proper typing
4. **Modern Patterns**: Uses latest Zustand patterns and middleware
5. **Easier Testing**: Simplified store structure for unit tests

## Automatic Migration

A V2 migration service automatically migrates data from legacy stores to V2 stores on application startup. See `/src/migrations/v2StoreMigration.ts` for details.

## Removal Timeline

- **Phase 4** (Current): Legacy stores deprecated, V2 migration complete
- **Phase 5** (Next): Enhanced features using V2 architecture only
- **v3.0**: Legacy stores will be completely removed

## Support

If you encounter issues with the V2 migration:

1. Check browser console for migration logs
2. Verify V2 stores contain expected data
3. Use V2 migration rollback if needed: `v2Migration.rollbackMigration()`

## Files Affected

This deprecation affects the following legacy store files:
- All files in `/src/store/` except `useAppStore.ts` (still in use)
- Components still importing from `/src/store/` need updating
- Tests referencing legacy stores need updating

**Last Updated**: Phase 4 - V2 Store Migration Complete