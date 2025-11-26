# User Settings

**English** | [Русский](./README.ru.md)

## Overview
User settings management module providing configuration for interface layouts, media paths, API keys, and OAuth integrations with comprehensive validation and encryption.

## Status
- ✅ **Components**: Fully implemented (widgets, tabs, modals)
- ✅ **Services**: Orchestrator and provider ready
- ✅ **Hooks**: useUserSettings and useApiKeys fully tested
- ✅ **Tests**: 87%+ coverage (126 tests passing)

## Structure
```
user-settings/
├── components/
│   ├── user-settings-modal.tsx
│   └── api-keys-form.tsx
├── hooks/
│   ├── use-user-settings.ts
│   └── use-api-keys.ts
├── services/
│   ├── user-settings-orchestrator.ts
│   └── user-settings-provider.tsx
├── constants/
│   └── api-validation-patterns.ts
└── types/
    └── settings.ts
```

## Features
### ✅ Implemented
- [x] Browser tab switching and layout modes (default, options, vertical, dual)
- [x] Screenshot paths configuration with validation
- [x] Player volume management (0-100)
- [x] API keys management (OpenAI, Claude, Grok, DeepSeek, Gemini)
- [x] OAuth integration (YouTube, Vimeo, Facebook, Instagram, TikTok, Twitter)
- [x] Telegram Bot integration
- [x] Client-side format validation (regex patterns)
- [x] Server-side validation via real API requests
- [x] Automatic validation every 24 hours
- [x] Secure encrypted key storage
- [x] Key masking in UI and logs
- [x] Rate limits and account status info
- [x] Import/export via .env format

### ❌ Not Implemented
- [ ] Settings profiles
- [ ] Cross-device synchronization
- [ ] UI theme customization
- [ ] Advanced keyboard shortcuts
- [ ] Settings change debouncing
- [ ] Automatic backup

## Usage
```typescript
import { useUserSettings, useApiKeys } from '@/features/user-settings'

function MyComponent() {
  const {
    activeTab,
    layoutMode,
    playerVolume,
    handleTabChange,
    handleLayoutChange,
    handlePlayerVolumeChange
  } = useUserSettings()

  const { saveSimpleApiKey, testApiKey } = useApiKeys()

  return (
    <div>
      <p>Active tab: {activeTab}</p>
      <p>Layout: {layoutMode}</p>
      <p>Volume: {playerVolume}</p>
    </div>
  )
}
```

## Integration
- **Depends on**: @/lib/tauri-utils, React Context
- **Used by**: @/features/media-studio, @/features/browser, @/features/video-player, @/features/ai-chat

## Testing
- **Total tests**: 126 tests
- **Coverage**: 87%+ (Orchestrator: 100%, Provider: 95%, Hooks: 100%, Components: 90%)

```bash
bun test src/features/user-settings
```

## TODO / Roadmap
- [ ] Settings profiles support
- [ ] Cloud sync for settings
- [ ] UI theme configuration
- [ ] Extended keyboard shortcuts
- [ ] Debounce for frequent changes
- [ ] Settings caching optimization
- [ ] Automatic backup system
- [ ] E2E tests (currently planned in `e2e/tauri/features/user-settings/`)
