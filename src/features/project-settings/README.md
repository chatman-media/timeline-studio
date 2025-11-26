# Project Settings

**English** | [Русский](./README.ru.md)

## Overview
Project configuration management module providing video settings, aspect ratios, frame rates, and color space selection with XState-powered state management.

## Status
- ✅ **Components**: ProjectSettingsModal fully implemented
- ✅ **Hooks**: useProjectSettings ready
- ✅ **Services**: XState machine and provider complete
- ✅ **Tests**: 89% coverage (89% statements, 87% functions, 48+ tests)

## Structure
```
project-settings/
├── components/
│   └── project-settings-modal.tsx   # Settings modal dialog
├── hooks/
│   └── use-project-settings.ts      # Settings hook
├── services/
│   ├── project-settings-machine.ts  # XState machine
│   └── project-settings-provider.tsx # React Context provider
├── types/
│   ├── project.ts                   # TypeScript types
│   └── timeline-studio-project.ts   # Project types
├── utils/
│   ├── aspect-ratio-utils.ts        # Aspect ratio utilities
│   ├── localization-utils.ts        # Localization utilities
│   └── settings-utils.ts            # Settings utilities
└── __tests__/
    ├── components/                  # Component tests (48 tests)
    ├── hooks/                       # Hook tests
    ├── services/                    # Service tests
    ├── utils/                       # Utility tests
    └── integration/                 # Integration tests
```

## Features
### ✅ Implemented
- [x] Aspect ratio selection (16:9, 9:16, 1:1, 4:3, 21:9, custom)
- [x] Video resolution presets (HD, Full HD, 4K, custom)
- [x] Frame rate selection (24, 25, 30, 50, 60, 120 fps)
- [x] Color space selection (Rec.709, Rec.2020, DCI-P3, sRGB)
- [x] Aspect ratio lock with auto-calculation
- [x] Input validation (320x240 to 7680x4320)
- [x] Localization support (15 languages)

### ❌ Not Implemented
- [ ] Settings templates and presets
- [ ] Import/export settings
- [ ] Social media presets (YouTube, Instagram, TikTok)
- [ ] Advanced encoding settings
- [ ] HDR settings
- [ ] Auto-save changes

## Usage
```typescript
import { useProjectSettings, ProjectSettingsProvider } from '@/features/project-settings'

// In components
function MyComponent() {
  const { settings, updateSettings, resetSettings } = useProjectSettings()

  return (
    <div>
      <h1>{settings.name}</h1>
      <p>Resolution: {settings.resolution}</p>
      <p>Frame Rate: {settings.frameRate} fps</p>

      <button onClick={() => updateSettings({
        ...settings,
        name: 'New Project'
      })}>
        Update Name
      </button>
    </div>
  )
}

// Wrap app with provider
<ProjectSettingsProvider>
  <MyComponent />
</ProjectSettingsProvider>
```

## Integration
- **Depends on**: @/i18n (localization)
- **Used by**: @/features/timeline, @/features/video-player, @/features/export
- **TopBar**: Displays project name, settings button
- **Timeline**: Uses resolution for scaling, frame rate for playback

## Testing
- **Total tests**: 48+ tests
- **Coverage**: 89% statements, 87% functions

```bash
# Run all tests
bun test src/features/project-settings

# Run specific test group
bun test src/features/project-settings/__tests__/components
bun test src/features/project-settings/__tests__/utils
```

## TODO / Roadmap
- [ ] Settings templates system
- [ ] Import/export settings functionality
- [ ] Social media platform presets
- [ ] Advanced encoding configuration
- [ ] HDR and advanced color space settings
- [ ] Auto-save with debouncing
- [ ] Undo/Redo for settings changes
- [ ] Settings validation improvements
- [ ] Batch project settings updates
