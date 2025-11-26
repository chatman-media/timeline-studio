# Updates

**English** | [Русский](./README.ru.md)

## Overview

The Updates module provides comprehensive application update management for Timeline Studio, handling automatic updates, notifications, and user preferences through Tauri's updater system.

## Status

- ✅ **Components**: 4 components for update UI (manager, notification, settings, status)
- ✅ **Hooks**: 1 hook for update management
- ✅ **Services**: XState machine and update service with Tauri integration
- ✅ **Tests**: Component and service tests available

## Structure

```
updates/
├── components/                      # UI components
│   ├── update-manager.tsx          # Main update management interface
│   ├── update-notification.tsx     # Toast notifications
│   ├── update-settings.tsx         # User preferences
│   └── update-status-indicator.tsx # Visual status indicator
├── hooks/                          # React hooks
│   └── use-update-manager.ts       # Main update hook
├── services/                       # Update logic
│   ├── update-machine.ts           # XState machine
│   └── update-service.ts           # Tauri updater integration
└── __tests__/                      # Test files
```

## Features

### ✅ Implemented

**Update Management:**
- [x] Automatic update checking (periodic background checks)
- [x] Manual update checks (user-initiated)
- [x] Download management with progress tracking
- [x] Installation control with user confirmation

**User Experience:**
- [x] Update notifications (non-intrusive)
- [x] Progress indicators (real-time)
- [x] Settings control (user preferences)
- [x] Status visualization (clear state indication)

**Update States:**
- [x] `idle` - No update activity
- [x] `checking` - Checking for updates
- [x] `available` - Update ready for download
- [x] `downloading` - Update being downloaded
- [x] `downloaded` - Update ready for installation
- [x] `installing` - Update being installed
- [x] `error` - Error occurred

### ❌ Not Implemented

**Advanced Features:**
- [ ] Differential updates (only changed files)
- [ ] Rollback capability (revert to previous versions)
- [ ] Update scheduling (specific times)
- [ ] Bandwidth limiting (download speed control)
- [ ] Background updates (silent updates)
- [ ] Update channels (stable/beta/alpha switching)

## Usage

```typescript
import { useUpdateManager } from '@/features/updates';

function App() {
  const {
    state,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate
  } = useUpdateManager();

  return (
    <div>
      <button onClick={checkForUpdates}>
        Check for Updates
      </button>

      {state === 'available' && (
        <button onClick={downloadUpdate}>
          Download Update
        </button>
      )}

      {state === 'downloaded' && (
        <button onClick={installUpdate}>
          Install & Restart
        </button>
      )}
    </div>
  );
}
```

## Integration

- **Depends on**: `@tauri-apps/api` (Tauri updater system)
- **Used by**: `@/features/app-settings`, Main application UI
- **Backend Command**: `download_and_install_update` (Tauri command)

## Testing

```bash
# Run update component tests
bun run test src/features/updates/components

# Test update state machine
bun run test src/features/updates/services/update-machine.test.ts

# Run all updates tests
bun run test src/features/updates
```

## TODO / Roadmap

### High Priority
- [ ] E2E tests for update workflow
- [ ] Enhanced error handling and recovery
- [ ] Update verification (signature and checksum)

### Medium Priority
- [ ] Differential updates implementation
- [ ] Update scheduling system
- [ ] Rollback capability

### Low Priority
- [ ] Bandwidth limiting for downloads
- [ ] Update analytics tracking
- [ ] Custom update sources support

## Configuration

### Tauri Configuration

```json
{
  "updater": {
    "active": true,
    "endpoints": ["https://releases.timeline-studio.com/updates"],
    "dialog": false,
    "pubkey": "your-public-key-here"
  }
}
```

### Update Settings

- **Auto Check**: Enable/disable automatic checking
- **Check Interval**: Hourly, daily, weekly
- **Auto Download**: Automatically download updates
- **Auto Install**: Automatically install updates
- **Notification Preferences**: Control notification display

## Security Features

- **Signature Verification**: All updates cryptographically signed
- **Checksum Validation**: Files validated before installation
- **Secure Channels**: HTTPS-only communication
- **User Consent**: Explicit confirmation for installations

---

**Version:** 1.0
**Last Updated:** 2025-11-26
