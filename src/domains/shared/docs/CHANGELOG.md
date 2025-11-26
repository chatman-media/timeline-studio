# Shared Domain - Changelog

## History of changes and audits

---

## [2024-11-26] Documentation Restructure

**Status:** Completed

### Changes
- Created docs/ directory structure
- Added API.md with full API reference
- Added ARCHITECTURE.md with architecture diagrams
- CHANGELOG.md extracted to docs/
- README.md refactored to concise overview

---

## [2024-11-25] Service Contracts Expansion

**Status:** Completed

### Changes
- Added IExportContract for video export
- Added IAIServiceContract for AI operations
- Added INotificationContract for notifications
- Added ILoggerContract for logging
- Expanded MediaAnalysisResult with more fields

---

## [2024-11-24] Event Bus Implementation

**Status:** Completed

### Changes
- Implemented DomainEventBus singleton
- Added wildcard subscription support
- Added event history (last 1000 events)
- Added timeout protection for handlers
- Added slow handler detection logging

### Event Types Added
- AI Services events
- Media Management events
- Project Management events
- System Integration events
- Video Editing events

---

## Event Constants

### AI Services Events

```typescript
AI_SERVICES_EVENTS = {
  ANALYSIS_STARTED: "ai.analysis.started",
  ANALYSIS_COMPLETED: "ai.analysis.completed",
  ANALYSIS_FAILED: "ai.analysis.failed",
  ANALYSIS_PROGRESS: "ai.analysis.progress",
  MODEL_LOADED: "ai.model.loaded",
  MODEL_UNLOADED: "ai.model.unloaded"
}
```

### Media Management Events

```typescript
MEDIA_MANAGEMENT_EVENTS = {
  FILE_IMPORTED: "media.file.imported",
  FILE_DELETED: "media.file.deleted",
  METADATA_UPDATED: "media.metadata.updated",
  THUMBNAIL_GENERATED: "media.thumbnail.generated",
  PROXY_CREATED: "media.proxy.created",
  WAVEFORM_GENERATED: "media.waveform.generated"
}
```

### Video Editing Events

```typescript
VIDEO_EDITING_EVENTS = {
  CLIP_ADDED: "video.clip.added",
  CLIP_REMOVED: "video.clip.removed",
  CLIP_UPDATED: "video.clip.updated",
  TRACK_ADDED: "video.track.added",
  TRACK_REMOVED: "video.track.removed",
  TIMELINE_UPDATED: "video.timeline.updated",
  PLAYBACK_STARTED: "video.playback.started",
  PLAYBACK_PAUSED: "video.playback.paused"
}
```

### Project Management Events

```typescript
PROJECT_MANAGEMENT_EVENTS = {
  PROJECT_CREATED: "project.created",
  PROJECT_SAVED: "project.saved",
  PROJECT_LOADED: "project.loaded",
  PROJECT_CLOSED: "project.closed",
  SETTINGS_UPDATED: "project.settings.updated"
}
```

### System Integration Events

```typescript
SYSTEM_INTEGRATION_EVENTS = {
  UPDATE_AVAILABLE: "system.update.available",
  UPDATE_DOWNLOADED: "system.update.downloaded",
  MODAL_OPENED: "system.modal.opened",
  MODAL_CLOSED: "system.modal.closed",
  NOTIFICATION_SHOWN: "system.notification.shown"
}
```

---

## Behavior (from tests)

### domain-event-bus.test.ts
- DomainEventBus is a singleton
- subscribe() returns unsubscribe function
- publish() returns PublishResult with eventId and handlerCount
- Handlers receive correct event payload
- Wildcard subscriptions work ("*", "clip.*")
- Event filter by source domain works
- Priority ordering of handlers works
- Once option removes handler after first call
- Timeout protection works for slow handlers
- Event history is stored (up to 1000)
- getHistory() with filter works
- clearHistory() removes all events
- reset() clears subscriptions and history
- getStats() returns correct statistics

### config.test.ts
- getConfig() returns default value if key not found
- setConfig() stores value
- mergeConfigs() combines configurations correctly
- Deep merge works for nested objects

### file.test.ts
- getFileExtension() extracts extension
- getFileName() extracts name without extension
- getMediaType() returns correct type for video/audio/image
- isVideoFile() returns true for video extensions
- isAudioFile() returns true for audio extensions
- isImageFile() returns true for image extensions
- Handles edge cases (no extension, dots in name)

### id.test.ts
- generateId() returns unique IDs
- generateShortId() returns shorter IDs
- isValidId() validates ID format
- IDs are URL-safe

### time.test.ts
- formatDuration() formats seconds correctly
- formatTimestamp() includes frames
- parseTimestamp() converts string to seconds
- msToFrames() calculates frames from milliseconds
- framesToMs() calculates milliseconds from frames
- Handles edge cases (0, negative, large values)

### validation.test.ts
- validateFilePath() validates path format
- validateMediaType() validates media type
- validateSettings() validates settings object
- isValidUrl() validates URL format
- Returns detailed error messages

---

## Utility Functions

| Category | Functions |
|----------|-----------|
| Config | `getConfig`, `setConfig`, `mergeConfigs` |
| File | `getFileExtension`, `getFileName`, `getMediaType`, `isVideoFile`, `isAudioFile`, `isImageFile` |
| ID | `generateId`, `generateShortId`, `isValidId` |
| Time | `formatDuration`, `formatTimestamp`, `parseTimestamp`, `msToFrames`, `framesToMs` |
| Validation | `validateFilePath`, `validateMediaType`, `validateSettings`, `isValidUrl` |

---

## Dependencies

### Used by all domains
- `@/domains/ai-services`
- `@/domains/ai-tools`
- `@/domains/browser`
- `@/domains/media-management`
- `@/domains/project-management`
- `@/domains/system-integration`
- `@/domains/video-editing`

### External
- `nanoid` - ID generation
- `@/lib/tauri-logger` - Logging
