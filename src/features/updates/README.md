# Updates Module

The Updates module provides comprehensive application update management functionality for Timeline Studio, handling automatic updates, notifications, and user preferences for the update process.

## Overview

This module manages the entire update lifecycle from checking for updates to downloading and installing them, providing users with a smooth and controlled update experience through Tauri's updater system.

## Architecture

### Components

- **`update-manager.tsx`** - Main update management interface with update controls
- **`update-notification.tsx`** - Toast notifications for update status and actions
- **`update-settings.tsx`** - User preferences for update behavior and scheduling  
- **`update-status-indicator.tsx`** - Visual indicator showing current update status

### Services

- **`update-machine.ts`** - XState machine managing update states and transitions
- **`update-service.ts`** - Core update logic and Tauri updater integration

### Hooks

- **`use-update-manager.ts`** - Main hook providing update management functionality

## Features

### Update Management
- **Automatic Update Checking** - Periodic background checks for new versions
- **Manual Update Checks** - User-initiated update discovery
- **Download Management** - Progress tracking for update downloads
- **Installation Control** - Managed update installation with user confirmation

### User Experience
- **Update Notifications** - Non-intrusive notifications for available updates
- **Progress Indicators** - Real-time download and installation progress
- **Settings Control** - User preferences for update behavior
- **Status Visualization** - Clear indication of current update state

### Update States (XState Machine)
- `idle` - No update activity
- `checking` - Checking for available updates
- `available` - Update available for download
- `downloading` - Update being downloaded
- `downloaded` - Update ready for installation
- `installing` - Update being installed
- `error` - Error occurred during update process

## Usage

### Basic Update Management

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

### Update Settings Configuration

```typescript
import { UpdateSettings } from '@/features/updates';

function SettingsPage() {
  return (
    <UpdateSettings
      autoCheck={true}
      checkInterval="daily"
      autoDownload={false}
      autoInstall={false}
      notificationPreferences={{
        showAvailable: true,
        showProgress: true,
        showErrors: true
      }}
    />
  );
}
```

## Integration with Tauri

The module integrates with Tauri's built-in updater system:

```rust
// tauri.conf.json updater configuration
{
  "updater": {
    "active": true,
    "endpoints": ["https://releases.timeline-studio.com/updates"],
    "dialog": false,
    "pubkey": "your-public-key-here"
  }
}
```

## Configuration Options

### Update Settings
- **Auto Check** - Enable/disable automatic update checking
- **Check Interval** - Frequency of update checks (hourly, daily, weekly)
- **Auto Download** - Automatically download available updates
- **Auto Install** - Automatically install downloaded updates
- **Notification Preferences** - Control which update events show notifications

### Update Channels
- **Stable** - Production releases only
- **Beta** - Beta versions with new features
- **Alpha** - Development builds (requires opt-in)

## Error Handling

The module provides comprehensive error handling for:
- **Network Issues** - Failed update checks or downloads
- **Installation Failures** - Problems during update installation
- **Version Conflicts** - Incompatible update versions
- **Permission Errors** - Insufficient privileges for installation

## Security Features

- **Signature Verification** - All updates are cryptographically signed
- **Checksum Validation** - Downloaded files are validated before installation
- **Secure Channels** - HTTPS-only communication for update checking
- **User Consent** - Explicit user confirmation for installations

## Testing

### Component Testing
```bash
# Run update component tests
bun run test src/features/updates/components

# Test update state machine
bun run test src/features/updates/services/update-machine.test.ts
```

### Mock Update Server
```typescript
// Test with mock update responses
const mockUpdateService = {
  checkForUpdates: vi.fn().mockResolvedValue({
    available: true,
    version: '1.2.0',
    downloadUrl: 'https://example.com/update.zip'
  })
};
```

## Future Enhancements

### Planned Features
- **Differential Updates** - Download only changed files for faster updates
- **Rollback Capability** - Ability to revert to previous versions
- **Update Scheduling** - Schedule updates for specific times
- **Bandwidth Limiting** - Control download speed for updates
- **Multi-language Support** - Localized update messages and UI

### Advanced Features
- **Background Updates** - Silent updates with minimal user disruption
- **Update Channels** - Switch between stable/beta/alpha channels
- **Custom Update Sources** - Support for enterprise update servers
- **Update Analytics** - Track update success rates and performance

## Dependencies

- **@tauri-apps/api** - Tauri system integration
- **xstate** - State machine management
- **react** - UI components and hooks
- **tailwindcss** - Styling and animations

## Best Practices

1. **User Control** - Always provide user control over update installation
2. **Progress Feedback** - Show clear progress during downloads and installation
3. **Error Recovery** - Provide options to retry failed operations
4. **Data Safety** - Ensure user data is preserved during updates
5. **Testing** - Thoroughly test update scenarios before release

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/updates/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Проверка доступных обновлений | ⏳ Planned | - | 🔴 High |
| Tauri команда `download_and_install_update` | ⏳ Planned | - | 🔴 High |
| Отображение состояния обновления (idle, checking, available, downloading, downloaded, installing, error) | ⏳ Planned | - | 🔴 High |
| Отображение прогресса загрузки | ⏳ Planned | - | 🔴 High |
| Уведомления о доступных обновлениях | ⏳ Planned | - | 🟡 Medium |
| Отмена загрузки обновления | ⏳ Planned | - | 🟡 Medium |
| Настройки автоматического обновления (auto check, auto download, auto install) | ⏳ Planned | - | 🟡 Medium |
| Обработка ошибок при скачивании обновления | ⏳ Planned | - | 🟡 Medium |
| Выбор канала обновлений (stable, beta, alpha) | ⏳ Planned | - | 🟢 Low |
| Проверка подписи обновления | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал для безопасности обновлений
- 🟡 Medium - важный функционал для пользовательского опыта
- 🟢 Low - дополнительный функционал