# Export Feature Architecture Refactoring

**Status:** Planned
**Priority:** High
**Estimated Time:** 5 days
**Created:** 2025-01-29
**Related Features:** export, core/hooks, system-integration, video-editing, project-management

## Objective

Полный рефакторинг фичи `src/features/export` для соответствия Ports & Adapters архитектуре, создание core hooks для уведомлений и render queue.

## Current State

### Architecture Analysis

- **Total Files:** 29 (excluding tests)
- **Files with Domain Imports:** 10 (34%)
- **Architecture Compliance:** LOW (2/5)

### Critical Violations

#### 1. System Integration Domain Imports (5 files)

**services/oauth-service.ts** (line 3)
```typescript
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
```

**services/social-networks-service.ts** (line 3)
```typescript
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
```

**hooks/use-social-export.ts** (line 5)
```typescript
import { useNotifications } from "@/domains/system-integration"
```

**hooks/use-export-settings.ts** (line 5)
```typescript
import { useNotifications } from "@/domains/system-integration"
```

**components/export-modal.tsx** (line 6)
```typescript
import { useNotifications } from "@/domains/system-integration"
```

#### 2. Video Editing Domain Imports (6 files)

**hooks/use-render-queue.ts** (lines 3-12) - CRITICAL
```typescript
import { loadProject } from "@/domains/project-management/services/project-file-service"
import {
  cancelRender,
  getActiveJobs,
  OutputFormat,
  ProjectSchema,
  RenderJob,
  RenderStatus,
  renderProject,
} from "@/domains/video-editing"
```

**utils/project-schema-builder.ts** (line 1)
```typescript
import { OutputFormat, ProjectSchema } from "@/domains/video-editing"
```

**components/batch-export-tab.tsx** (line 10)
```typescript
import { RenderStatus } from "@/domains/video-editing"
```

**components/render-queue-dropdown.tsx** (line 16)
```typescript
import { RenderStatus } from "@/domains/video-editing"
```

**components/detailed-export-interface.tsx** (line 14)
```typescript
import { OutputFormat } from "@/domains/video-editing/types"
```

#### 3. Project Management Domain Imports (1 file)

**hooks/use-render-queue.ts** (line 3)
```typescript
import { loadProject } from "@/domains/project-management/services/project-file-service"
```

### Impact Summary

**useNotifications violations:** 3 hooks + 1 component + 2 services = 6 files
**Render operations violations:** 1 critical hook (use-render-queue)
**Type imports violations:** 4 files (OutputFormat, RenderStatus, ProjectSchema)

## Target Architecture

```
┌──────────────────────────────────────────┐
│       src/features/export                │
│                                          │
│  Components, Hooks, Services             │
└───────────────┬──────────────────────────┘
                │
                ↓ uses
┌──────────────────────────────────────────┐
│         @/core/hooks                     │
│                                          │
│  useNotifications()                      │
│  useRenderQueue()                        │
│  useProjectLoader()                      │
└───────────────┬──────────────────────────┘
                │
                ↓ uses
┌──────────────────────────────────────────┐
│         @/core/container                 │
│                                          │
│  getDependency('systemIntegration')      │
│  getDependency('videoEditing')           │
│  getDependency('projectManagement')      │
└───────────────┬──────────────────────────┘
                │
                ↓ implements
┌──────────────────────────────────────────┐
│         @/domains/*                      │
│                                          │
│  SystemIntegrationOrchestrator           │
│  VideoEditingService                     │
│  ProjectManagementService                │
└──────────────────────────────────────────┘
```

## Refactoring Plan

### Phase 1: Create Core Hooks (1 day)

#### Task 1.1: Create useNotifications hook

**Create:** `src/core/hooks/use-notifications.ts`

```typescript
import { useDependency } from "@/core/container"
import { useCallback, useMemo } from "react"

export function useNotifications() {
  const orchestrator = useDependency("systemIntegration")

  const showSuccess = useCallback(
    (title: string, message: string, duration = 3000) => {
      orchestrator.showNotification({
        type: "success",
        notification_type: "success",
        title,
        message,
        duration,
      })
    },
    [orchestrator],
  )

  const showError = useCallback(
    (title: string, message: string, duration = 5000) => {
      orchestrator.showNotification({
        type: "error",
        notification_type: "error",
        title,
        message,
        duration,
      })
    },
    [orchestrator],
  )

  const showInfo = useCallback(
    (title: string, message: string, duration = 3000) => {
      orchestrator.showNotification({
        type: "info",
        notification_type: "info",
        title,
        message,
        duration,
      })
    },
    [orchestrator],
  )

  const showWarning = useCallback(
    (title: string, message: string, duration = 4000) => {
      orchestrator.showNotification({
        type: "warning",
        notification_type: "warning",
        title,
        message,
        duration,
      })
    },
    [orchestrator],
  )

  return useMemo(
    () => ({
      showSuccess,
      showError,
      showInfo,
      showWarning,
    }),
    [showSuccess, showError, showInfo, showWarning],
  )
}
```

#### Task 1.2: Create useRenderQueue hook

**Create:** `src/core/hooks/use-render-queue.ts`

```typescript
import { useDependency } from "@/core/container"
import { useCallback, useMemo } from "react"

export function useRenderQueue() {
  const videoEditingService = useDependency("videoEditing")

  return useMemo(
    () => ({
      renderProject: (schema: any, outputPath: string) =>
        videoEditingService.renderProject(schema, outputPath),
      cancelRender: (jobId: string) => videoEditingService.cancelRender(jobId),
      getActiveJobs: () => videoEditingService.getActiveJobs(),
    }),
    [videoEditingService],
  )
}
```

#### Task 1.3: Create useProjectLoader hook

**Create:** `src/core/hooks/use-project-loader.ts`

```typescript
import { useDependency } from "@/core/container"
import { useCallback, useMemo } from "react"

export function useProjectLoader() {
  const projectService = useDependency("projectManagement")

  const loadProject = useCallback(
    async (path: string) => {
      return await projectService.loadProject(path)
    },
    [projectService],
  )

  const saveProject = useCallback(
    async (path: string, data: any) => {
      return await projectService.saveProject(path, data)
    },
    [projectService],
  )

  return useMemo(
    () => ({
      loadProject,
      saveProject,
    }),
    [loadProject, saveProject],
  )
}
```

#### Task 1.4: Create type re-exports

**Create:** `src/core/types/video-editing.ts`

```typescript
// Re-export commonly used types from video-editing domain
export type {
  OutputFormat,
  ProjectSchema,
  RenderJob,
  RenderStatus,
} from "@/domains/video-editing/types"
```

**Update:** `src/core/types/index.ts`

```typescript
export * from "./video-editing"
```

### Phase 2: Migrate use-render-queue Hook (1 day)

**Task:** Update `src/features/export/hooks/use-render-queue.ts`

**Before:**
```typescript
import { loadProject } from "@/domains/project-management/services/project-file-service"
import {
  cancelRender,
  getActiveJobs,
  OutputFormat,
  ProjectSchema,
  RenderJob,
  RenderStatus,
  renderProject,
} from "@/domains/video-editing"
```

**After:**
```typescript
import { useProjectLoader, useRenderQueue } from "@/core/hooks"
import type { OutputFormat, ProjectSchema, RenderJob, RenderStatus } from "@/core/types"

export function useRenderQueue(): UseRenderQueueReturn {
  const { loadProject } = useProjectLoader()
  const { renderProject, cancelRender, getActiveJobs } = useRenderQueue()

  // ... rest of implementation
}
```

**Files to update:**
- `src/features/export/hooks/use-render-queue.ts`

### Phase 3: Migrate Services (1 day)

#### Task 3.1: Update oauth-service.ts

**Before:**
```typescript
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
const orchestrator = getSystemIntegrationOrchestrator()
```

**After:**
```typescript
import { container } from "@/core"

// In functions that need notifications:
const orchestrator = container.getDependency("systemIntegration")
orchestrator.showNotification({ ... })
```

**Files to update:**
- `src/features/export/services/oauth-service.ts`

#### Task 3.2: Update social-networks-service.ts

**Before:**
```typescript
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
const orchestrator = getSystemIntegrationOrchestrator()
```

**After:**
```typescript
import { container } from "@/core"

const orchestrator = container.getDependency("systemIntegration")
```

**Files to update:**
- `src/features/export/services/social-networks-service.ts`

### Phase 4: Update Type Imports (0.5 days)

**Task:** Replace domain type imports with core type imports

**Files to update:**
1. `src/features/export/utils/project-schema-builder.ts`
   - Change: `import { OutputFormat, ProjectSchema } from "@/domains/video-editing"`
   - To: `import type { OutputFormat, ProjectSchema } from "@/core/types"`

2. `src/features/export/components/batch-export-tab.tsx`
   - Change: `import { RenderStatus } from "@/domains/video-editing"`
   - To: `import type { RenderStatus } from "@/core/types"`

3. `src/features/export/components/render-queue-dropdown.tsx`
   - Change: `import { RenderStatus } from "@/domains/video-editing"`
   - To: `import type { RenderStatus } from "@/core/types"`

4. `src/features/export/components/detailed-export-interface.tsx`
   - Change: `import { OutputFormat } from "@/domains/video-editing/types"`
   - To: `import type { OutputFormat } from "@/core/types"`

### Phase 5: Update Components and Hooks (0.5 days)

**Task:** Replace useNotifications imports

**Files to update:**
1. `src/features/export/hooks/use-social-export.ts`
   - Change: `import { useNotifications } from "@/domains/system-integration"`
   - To: `import { useNotifications } from "@/core/hooks"`

2. `src/features/export/hooks/use-export-settings.ts`
   - Change: `import { useNotifications } from "@/domains/system-integration"`
   - To: `import { useNotifications } from "@/core/hooks"`

3. `src/features/export/components/export-modal.tsx`
   - Change: `import { useNotifications } from "@/domains/system-integration"`
   - To: `import { useNotifications } from "@/core/hooks"`

### Phase 6: Testing (1 day)

**Test Scenarios:**

1. **Render Queue Operations**
   - Add projects to queue
   - Start batch rendering
   - Monitor render progress
   - Cancel individual jobs
   - Cancel all jobs
   - Clear completed jobs

2. **Social Export**
   - Login to social networks
   - Upload videos
   - Validate export settings
   - Show success/error notifications

3. **Export Settings**
   - Change export format
   - Update quality settings
   - Validate settings

4. **Notifications**
   - Success notifications work
   - Error notifications work
   - Info notifications work
   - Warning notifications work

**Test Files to Review:**
- `src/features/export/__tests__/hooks/use-render-queue.test.ts`
- `src/features/export/__tests__/integration/export-pipeline.test.tsx`
- Add tests for new core hooks

## Detailed File Changes

### Files to Create

1. **src/core/hooks/use-notifications.ts** (NEW)
   - Wraps system-integration orchestrator
   - Provides showSuccess, showError, showInfo, showWarning

2. **src/core/hooks/use-render-queue.ts** (NEW)
   - Wraps video-editing render operations
   - Provides renderProject, cancelRender, getActiveJobs

3. **src/core/hooks/use-project-loader.ts** (NEW)
   - Wraps project-management service
   - Provides loadProject, saveProject

4. **src/core/types/video-editing.ts** (NEW)
   - Re-exports commonly used types
   - OutputFormat, ProjectSchema, RenderJob, RenderStatus

### Files to Modify

1. **src/features/export/hooks/use-render-queue.ts** (CRITICAL)
   - Replace all domain imports with core hooks
   - Maintain existing API

2. **src/features/export/services/oauth-service.ts**
   - Use container instead of direct domain import

3. **src/features/export/services/social-networks-service.ts**
   - Use container instead of direct domain import

4. **src/features/export/hooks/use-social-export.ts**
   - Use @/core/hooks/use-notifications

5. **src/features/export/hooks/use-export-settings.ts**
   - Use @/core/hooks/use-notifications

6. **src/features/export/components/export-modal.tsx**
   - Use @/core/hooks/use-notifications

7. **src/features/export/components/batch-export-tab.tsx**
   - Use @/core/types for RenderStatus

8. **src/features/export/components/render-queue-dropdown.tsx**
   - Use @/core/types for RenderStatus

9. **src/features/export/components/detailed-export-interface.tsx**
   - Use @/core/types for OutputFormat

10. **src/features/export/utils/project-schema-builder.ts**
    - Use @/core/types for OutputFormat, ProjectSchema

### Files to Check

**Consumers to verify:**
- All components using render queue
- All hooks using notifications
- Social network upload flows
- Batch export workflows

## Dependencies

### Must Complete First
- None (can start immediately)

### Blocked By
- None

### Blocks
- Other features waiting for useNotifications, useRenderQueue hooks

## Success Criteria

- [ ] No direct imports from @/domains/system-integration
- [ ] No direct imports from @/domains/video-editing
- [ ] No direct imports from @/domains/project-management
- [ ] All hooks use @/core/hooks instead of domain imports
- [ ] All types use @/core/types instead of domain types
- [ ] All services use @/core/container for dependencies
- [ ] All existing functionality works
- [ ] All tests pass
- [ ] No TypeScript errors

## Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Create core hooks | 1 day |
| 2 | Migrate use-render-queue | 1 day |
| 3 | Migrate services | 1 day |
| 4 | Update type imports | 0.5 days |
| 5 | Update components/hooks | 0.5 days |
| 6 | Testing | 1 day |
| **Total** | | **5 days** |

**Note:** Phases 1-3 can be parallelized if multiple developers available.

## Risk Assessment

### High Risk
- use-render-queue is critical for export functionality
- Render queue operations must work reliably
- Social network OAuth flow is complex

### Medium Risk
- Many files depend on useNotifications
- Type changes might affect other features
- Service layer changes need careful testing

### Mitigation
- Create core hooks first, then migrate one file at a time
- Test render queue extensively before deploying
- Keep backward compatibility if needed during transition
- Add comprehensive tests for new core hooks

## Notes

- This is the largest refactoring task (10 files, 34% of feature)
- useNotifications will be reused by many other features
- useRenderQueue is export-specific but follows core pattern
- Type re-exports in @/core/types simplify imports across all features
- Consider creating migration guide for other features
