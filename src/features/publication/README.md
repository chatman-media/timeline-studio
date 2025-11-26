# Publication

**English** | [Русский](./README.ru.md)

## Overview

Publication tasks management system for Timeline Studio. Provides integration with video hosting platforms (YouTube, TikTok, VK) through plugin system. Monitors upload progress, manages publication metadata, and tracks task status.

## Status

- ✅ **Components**: Publication tasks dropdown
- ✅ **Hooks**: use-publication-tasks
- ✅ **Types**: Publication task and status types
- ⚠️ **Tests**: Not implemented yet

## Structure

```
publication/
├── components/               # UI components
│   └── publication-tasks-dropdown.tsx
├── hooks/                    # React hooks
│   └── use-publication-tasks.ts
└── types/                    # TypeScript types
    └── publication.ts
```

## Features

### ✅ Implemented

- [x] Publication status tracking (Preparing, Uploading, Processing, Completed, Failed, Cancelled)
- [x] Progress tracking (percentage, bytes uploaded, messages)
- [x] Task management (list, get by ID, cancel)
- [x] Auto-refresh every 5 seconds
- [x] Plugin availability detection
- [x] YouTube uploader integration
- [x] Localized status labels
- [x] Status color indicators
- [x] Duration formatting

### ❌ Not Implemented

- [ ] TikTok platform support
- [ ] VK platform support
- [ ] Instagram platform support
- [ ] Facebook platform support
- [ ] Twitter platform support
- [ ] Multiple concurrent uploads
- [ ] Upload queue management
- [ ] Upload scheduling
- [ ] Retry failed uploads
- [ ] Unit tests for hooks and components

## Usage

```typescript
import { usePublicationTasks } from '@/features/publication'

function PublicationPanel() {
  const {
    tasks,           // Array of publication tasks
    isLoading,       // Loading state
    error,           // Error message if any
    refreshTasks,    // Manual refresh
    getTask,         // Get task by ID
    cancelTask,      // Cancel upload
  } = usePublicationTasks()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>Status: {task.status}</p>
          {task.progress && (
            <progress value={task.progress.percentage} max={100} />
          )}
          <button onClick={() => cancelTask(task.id)}>Cancel</button>
        </div>
      ))}
    </div>
  )
}
```

## Integration

- **Depends on**:
  - `@tauri-apps/api/core` - for invoke commands
  - `@/lib/duration-formatter` - for time formatting
  - `@/lib/tauri-logger` - for logging
  - Plugin system: `youtube-uploader` plugin
- **Used by**:
  - Media Studio - for export and publication
  - Project export workflow

## Testing

- **Total tests**: 0 (needs to be implemented)
- **Planned tests**:
  - Hook functionality
  - Component rendering
  - Plugin communication
  - Progress updates
  - Error handling

## TODO / Roadmap

- [ ] Implement unit tests for hooks and components
- [ ] E2E tests for publication workflow (14 tests planned)
- [ ] Add support for more platforms (TikTok, VK, Instagram, Facebook, Twitter)
- [ ] Implement upload queue management
- [ ] Add upload scheduling feature
- [ ] Implement retry mechanism for failed uploads
- [ ] Add upload analytics and history
- [ ] Implement batch upload for multiple videos
- [ ] Add custom metadata templates
- [ ] Implement upload presets
