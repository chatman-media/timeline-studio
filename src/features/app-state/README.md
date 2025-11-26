# App State

**English** | [Русский](./README.ru.md)

## Overview

App State is the global state management module for Timeline Studio. It provides centralized state management for application settings, projects, media library, favorites, and user preferences using XState machines and React Context.

## Status

- ✅ **Components**: MissingFilesDialog component (97% coverage)
- ✅ **Hooks**: All hooks fully covered (100%)
- ✅ **Services**: AppSettingsMachine (78%), ProjectFileService (99%), StoreService (100%), AppDirectoriesService (92%)
- ✅ **Tests**: 124 tests passing

## Structure

```
app-state/
├── components/
│   └── missing-files-dialog.tsx    # File restoration dialog (97%)
├── hooks/
│   ├── use-app-settings.ts         # Base hook
│   ├── use-current-project.ts      # Current project management
│   ├── use-recent-projects.ts      # Recent projects
│   ├── use-favorites.ts            # Favorites
│   ├── use-media-files.ts          # Media files
│   └── use-music-files.ts          # Music files
├── services/
│   ├── app-settings-machine.ts     # State machine (78%)
│   ├── app-settings-provider.tsx   # Context provider (67%)
│   ├── app-directories-service.ts  # Directory management (92%)
│   ├── project-file-service.ts     # Project file operations (99%)
│   ├── store-service.ts            # Storage service (100%)
│   └── batch-commands.ts           # Batch command execution
└── __tests__/
    ├── components/                 # Component tests
    ├── hooks/                      # Hook tests
    └── services/                   # Service tests
```

## Features

### ✅ Implemented

- [x] AppSettingsMachine - State machine for settings (78% coverage)
- [x] AppSettingsProvider - Context provider (67% coverage)
- [x] AppDirectoriesService - Directory management (92% coverage)
- [x] StoreService - Data storage service (100% coverage)
- [x] ProjectFileService - Project file operations (99% coverage)
- [x] BatchCommandBuilder - Execute multiple commands in batch
- [x] MissingFilesDialog - File restoration UI (97% coverage)
- [x] Typed application settings
- [x] Global state for the entire application
- [x] User preferences persistence
- [x] Project management (create, open, save)
- [x] Media library management
- [x] Favorites system

### ❌ Not Implemented

- [ ] Clear separation between app settings and project settings
- [ ] Migration of media files to separate module
- [ ] Settings synchronization between windows
- [ ] Settings backup and restore
- [ ] Configuration import/export

## Usage

### Basic App State Access

```typescript
import { useAppSettings } from "@/features/app-state"

function MyComponent() {
  const { settings, updateSettings } = useAppSettings()

  return <div>Theme: {settings.theme}</div>
}
```

### Project Management

```typescript
import { useCurrentProject } from "@/features/app-state"

function ProjectComponent() {
  const { currentProject, createProject, saveProject } = useCurrentProject()

  const handleCreate = async () => {
    await createProject({ name: "New Project" })
  }

  const handleSave = async () => {
    await saveProject()
  }
}
```

### Batch Commands

```typescript
import { useBatchCommands } from "@/features/app-state"

function BatchExample() {
  const { executeBatch, operations, isExecuting } = useBatchCommands()

  const setupTimeline = async () => {
    const result = await operations.setupTimelineWithContent({
      projectName: "My Video",
      tracks: 3,
      mediaFiles: ["file1.mp4", "file2.mp4"],
      clips: [/* clip data */]
    })
  }
}
```

## Integration

- **Depends on**: `@tauri-apps/api`, `xstate`, UI components
- **Used by**: All features requiring global state access

## Testing

- **Total tests**: 124 tests
- **Overall coverage**: 57.55%
- **Components**: 97%
- **Services**: 84.25%
- **Hooks**: 100%

### Test Suites

- `project-file-service.test.ts` - Project loading, saving, migration (20+ tests)
- `app-directories-service.test.ts` - Directory management, cache operations (10 tests)
- `batch-commands.test.ts` - Batch command execution, utilities (40+ tests)

### Running Tests

```bash
# Run all app-state tests
bun run test src/features/app-state/

# Run with coverage
bun run test:coverage src/features/app-state/

# Run in watch mode
bun run test:watch src/features/app-state/
```

## TODO / Roadmap

### High Priority
- [ ] Increase AppSettingsProvider coverage (currently 67%)
- [ ] Refactor to eliminate mixed responsibilities
- [ ] Clear separation between app and project settings

### Medium Priority
- [ ] Settings synchronization between windows
- [ ] Settings backup and restore
- [ ] Configuration import/export
- [ ] Migrate media files to separate domain

### Low Priority
- [ ] Settings migration tools
- [ ] Settings validation and schema versioning
- [ ] Advanced batch operation monitoring

## Known Issues

- Mixed responsibilities in app-settings-machine
- Data duplication between settings and projects
- Poor isolation between domains

## Documentation

See also:
- Project Management: `/docs/03_architecture/state-management.md`
- Batch Commands: Service documentation in `services/batch-commands.ts`
