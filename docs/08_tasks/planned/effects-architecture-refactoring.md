# Effects Feature Architecture Refactoring

**Status:** Planned
**Priority:** Medium
**Estimated Time:** 2.5 days
**Created:** 2025-01-29
**Related Features:** effects, drag-drop, core/hooks

## Objective

Рефакторинг фичи `src/features/effects` для полного соответствия Ports & Adapters архитектуре и миграция на единую систему drag & drop.

## Current State

### Architecture Analysis

- **Total Files:** 55 (excluding tests)
- **Files with Domain Imports:** 3 (5.5%)
- **Architecture Compliance:** MEDIUM (3/5)

### Violations Found

#### 1. Direct Domain Imports (3 files)

**src/features/effects/index.ts** (lines 64-77)
- Type exports: `PresetsCollection`, `UserPreset`
- Function exports: `clearAllPresets`, `convertUserPresetToEffectPreset`, `deleteUserPreset`, `exportPresets`, `getAllUserPresets`, `getFavoritePresets`, `importPresets`, `loadPresetsForEffect`, `loadUserPreset`, `saveUserPreset`, `updateUserPreset`
- Purpose: Re-export for backward compatibility

**src/features/effects/utils/user-effects.ts** (lines 142-156)
- Type exports: `UserEffect`, `UserEffectsCollection`
- Function exports: `addEffectToClip`, `addFilterToClip`, `createEffect`, `createFilter`, `deleteUserEffect`, `getUserEffectsList`, `loadEffectsCollection`, `loadUserEffect`, `removeEffectFromClip`, `removeFilterFromClip`, `saveEffectsCollection`, `saveUserEffect`
- Purpose: Re-export for backward compatibility (comment at line 5-7)

**src/features/effects/hooks/use-user-presets.ts** (lines 6-14)
- Type import: `UserPreset`
- Function imports: `deleteUserPreset`, `getAllUserPresets`, `loadPresetsForEffect`, `loadUserPreset`, `saveUserPreset`, `updateUserPreset`
- Purpose: React hook that wraps domain functions
- **CRITICAL:** This is the only file that actually uses domain functions directly

#### 2. Deprecated Drag & Drop Library

**src/features/effects/components/effect-drag-source.tsx**
- Uses old `@dnd-kit/core` library
- Should use unified `@/features/drag-drop` system instead

### Good Practices

✅ **Most violations are re-exports** (2 out of 3 files)
✅ **Only 1 hook uses domain functions directly**
✅ **Clean separation of utilities** (pure functions)
✅ **No other domain dependencies**

## Target Architecture

```
┌─────────────────────────────────────────┐
│         src/features/effects            │
│                                         │
│  Components, Hooks, Utils              │
└───────────────┬─────────────────────────┘
                │
                ↓ uses
┌─────────────────────────────────────────┐
│         @/core/hooks                    │
│                                         │
│  useUserPresets()                      │
│  ├─ getAllUserPresets()                │
│  ├─ saveUserPreset()                   │
│  ├─ deleteUserPreset()                 │
│  └─ ...                                │
└───────────────┬─────────────────────────┘
                │
                ↓ uses
┌─────────────────────────────────────────┐
│      @/core/container                   │
│                                         │
│  getDependency('effects')              │
└───────────────┬─────────────────────────┘
                │
                ↓ implements
┌─────────────────────────────────────────┐
│  @/domains/video-editing/services      │
│                                         │
│  UserPresetsService                    │
│  EffectsService                        │
└─────────────────────────────────────────┘
```

## Refactoring Plan

### Phase 1: Create Core Hooks (0.5 days)

**Task:** Create `@/core/hooks/use-user-presets.ts`

```typescript
import { useDependency } from "@/core/container"
import { useMemo } from "react"

export function useUserPresets() {
  const effectsService = useDependency("effects")

  return useMemo(
    () => ({
      getAllUserPresets: () => effectsService.getAllUserPresets(),
      saveUserPreset: (effectId: string, name: string, params: any, options?: any) =>
        effectsService.saveUserPreset(effectId, name, params, options),
      loadUserPreset: (presetId: string) => effectsService.loadUserPreset(presetId),
      updateUserPreset: (presetId: string, updates: any) =>
        effectsService.updateUserPreset(presetId, updates),
      deleteUserPreset: (presetId: string) => effectsService.deleteUserPreset(presetId),
      loadPresetsForEffect: (effectId: string) =>
        effectsService.loadPresetsForEffect(effectId),
    }),
    [effectsService],
  )
}
```

**Files to create:**
- `src/core/hooks/use-user-presets.ts`

### Phase 2: Update Effects Hook (0.5 days)

**Task:** Migrate `src/features/effects/hooks/use-user-presets.ts` to use core hook

**Before:**
```typescript
import type { UserPreset } from "@/domains/video-editing/services/effects/user-presets-service"
import {
  deleteUserPreset,
  getAllUserPresets,
  // ...
} from "@/domains/video-editing/services/effects/user-presets-service"

export function useUserPresets(options = {}) {
  const savePreset = useCallback(async (...) => {
    const preset = await saveUserPreset(effectId, name, params, options)
    // ...
  }, [])
}
```

**After:**
```typescript
import { useUserPresets as useCoreUserPresets } from "@/core/hooks/use-user-presets"

export function useUserPresets(options = {}) {
  const presetsService = useCoreUserPresets()

  const savePreset = useCallback(async (...) => {
    const preset = await presetsService.saveUserPreset(effectId, name, params, options)
    // ...
  }, [presetsService])
}
```

**Files to update:**
- `src/features/effects/hooks/use-user-presets.ts`

### Phase 3: Migrate Drag & Drop (0.5 days)

**Task:** Replace `@dnd-kit/core` with unified `@/features/drag-drop`

**Before (effect-drag-source.tsx):**
```typescript
import { useDraggable } from "@dnd-kit/core"

const { attributes, listeners, setNodeRef } = useDraggable({
  id: effect.id,
  data: effect,
})
```

**After:**
```typescript
import { useDraggable } from "@/features/drag-drop"

const dragProps = useDraggable("effect", () => effect, () => ({
  url: effect.thumbnail,
  width: 120,
  height: 80,
}))
```

**Files to update:**
- `src/features/effects/components/effect-drag-source.tsx`

**Dependencies to remove:**
- `@dnd-kit/core` from package.json (if not used elsewhere)

### Phase 4: Remove Re-exports (0.5 days)

**Task:** Remove backward compatibility re-exports and update consumers

**Files to update:**
- `src/features/effects/index.ts` (remove lines 64-77)
- `src/features/effects/utils/user-effects.ts` (remove lines 142-156)

**Find consumers:**
```bash
# Search for imports from these files
rg "from ['\"]@/features/effects['\"]" -A 2
rg "from ['\"]@/features/effects/utils/user-effects['\"]" -A 2
```

**Update consumers to use:**
- `@/core/hooks/use-user-presets` instead of feature exports
- Direct domain imports should be migrated to core hooks

### Phase 5: Testing (0.5 days)

**Task:** Ensure all functionality works after refactoring

**Test scenarios:**
1. Load user presets for an effect
2. Save new preset
3. Update existing preset
4. Delete preset
5. Drag effect from browser to timeline
6. Load presets collection
7. Export/import presets

**Test files to review:**
- Check if any tests need updating for new architecture
- Add tests for new core hooks if needed

## Detailed File Changes

### Files to Create

1. **src/core/hooks/use-user-presets.ts** (NEW)
   - Wraps effects service from container
   - Provides all preset-related methods
   - Type-safe API

### Files to Modify

1. **src/features/effects/hooks/use-user-presets.ts**
   - Remove direct domain imports
   - Use `@/core/hooks/use-user-presets` instead
   - Keep existing API for feature consumers

2. **src/features/effects/components/effect-drag-source.tsx**
   - Remove `@dnd-kit/core` import
   - Import and use `@/features/drag-drop` instead
   - Update draggable configuration

3. **src/features/effects/index.ts**
   - Remove re-export lines 64-77
   - Keep only feature-specific exports

4. **src/features/effects/utils/user-effects.ts**
   - Remove re-export lines 142-156
   - Remove backward compatibility comment
   - Keep only feature-specific utilities

### Files to Check

**Consumers of removed exports:**
- Search codebase for imports from `@/features/effects` that use preset functions
- Update to use `@/core/hooks/use-user-presets` instead

## Dependencies

### Must Complete First
- None (can start immediately)

### Blocked By
- None

### Blocks
- None (other features can continue independently)

## Success Criteria

- [ ] No direct imports from `@/domains/video-editing/services/effects`
- [ ] All preset operations use `@/core/hooks/use-user-presets`
- [ ] Using unified `@/features/drag-drop` instead of `@dnd-kit/core`
- [ ] All backward compatibility re-exports removed
- [ ] All existing functionality still works
- [ ] Tests pass
- [ ] No TypeScript errors

## Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Create core hooks | 0.5 days |
| 2 | Update effects hook | 0.5 days |
| 3 | Migrate drag & drop | 0.5 days |
| 4 | Remove re-exports | 0.5 days |
| 5 | Testing | 0.5 days |
| **Total** | | **2.5 days** |

**Note:** Phases 1-2 and Phase 3 can be done in parallel if multiple developers available.

## Risk Assessment

### Low Risk
- Only 3 files with violations
- Most are simple re-exports
- Unified drag-drop is already proven in other features

### Medium Risk
- Need to find and update all consumers of re-exported functions
- Drag-drop migration might affect UX if not tested properly

### Mitigation
- Search thoroughly for all consumers before removing re-exports
- Test drag-drop functionality extensively
- Keep backward compatibility temporarily if needed

## Notes

- This refactoring aligns with the same pattern used in other features
- ResourceCategoryDropZone already uses unified drag-drop successfully
- Core hooks pattern is proven in browser and other features
- Consider creating a checklist for similar refactorings in other features
