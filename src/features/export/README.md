# Export

**English** | [Русский](./README.ru.md)

## Overview

Comprehensive video export system with professional presets, social media integration (YouTube, TikTok, Vimeo, Telegram), batch export, and section export. Features 4-tab interface similar to DaVinci Resolve with H.264/H.265/ProRes codecs, OAuth authentication, and render queue management.

## Status

- ✅ **Components**: 6/6 implemented (ExportModal, LocalExportTab, SocialExportTab, BatchExportTab, SectionExportTab, DetailedExportInterface)
- ✅ **Hooks**: 3/3 implemented (useExportSettings, useSocialExport, useRenderQueue)
- ✅ **Services**: 3/3 implemented (OAuthService, SocialNetworksService, SecureTokenStorage)
- ✅ **Tests**: 40+ tests passing (~90% coverage)
- ✅ **Status**: Production ready - 95% complete

## Structure

```
export/
├── components/
│   ├── export-modal.tsx
│   ├── export-presets.tsx
│   ├── detailed-export-interface.tsx
│   ├── social-export-tab.tsx
│   ├── batch-export-tab.tsx
│   └── section-export-tab.tsx
├── hooks/
│   ├── use-export-settings.ts
│   ├── use-social-export.ts
│   └── use-render-queue.ts
├── services/
│   ├── social-networks-service.ts
│   ├── oauth-service.ts
│   └── secure-token-storage.ts
├── constants/
│   └── export-constants.ts
├── types/
│   └── export-types.ts
├── utils/
│   └── preset-configs.ts
└── __tests__/
```

## Features

### ✅ Implemented

**Local Export**
- [x] Professional export interface (4 tabs like DaVinci Resolve)
- [x] Export presets (H.264 Master, H.265, ProRes, HyperDeck, etc.)
- [x] Quality settings (Custom, Good, Best with automatic bitrate)
- [x] Resolution selection (720p, 1080p, 1440p, 4K, Timeline)
- [x] FPS selection (24, 25, 30, 60 fps, Timeline)
- [x] Format support (MP4, MOV, WebM, QuickTime)
- [x] Codec support (H.264, H.265/HEVC, ProRes, VP8, VP9)
- [x] GPU acceleration support
- [x] Export progress tracking

**Social Media Integration**
- [x] YouTube - OAuth 2.0 integration, optimized settings
- [x] TikTok - Vertical formats, direct upload
- [x] Vimeo - High quality, professional settings
- [x] Telegram - Bot API, file size optimization

**Batch Export**
- [x] Multiple project export via render queue
- [x] Queue management (add, cancel, statistics)
- [x] Parallel rendering optimization
- [x] Export reports with detailed statistics

**Section Export**
- [x] By markers - automatic splitting between markers
- [x] By clips - export each clip separately
- [x] Manual ranges - custom time ranges
- [x] Quality presets (Preview/Draft/Final)
- [x] Individual file naming

**Advanced Features**
- [x] OAuth integration for all social platforms
- [x] Secure token storage
- [x] Render queue integration
- [x] Full internationalization (15 languages)
- [x] Professional formats (ProRes, H.264/H.265 Master)

### ❌ Not Implemented

- [ ] Advanced audio export settings (partially ready)
- [ ] Timecode burn-in options

## Usage

### Basic Export

```typescript
import { ExportModal } from '@/features/export'

function App() {
  return <ExportModal />
}
```

### Export Presets

```typescript
import { ExportPresets, EXPORT_PRESETS } from '@/features/export'

function MyExportUI() {
  const [selectedPreset, setSelectedPreset] = useState('custom')

  return (
    <ExportPresets
      selectedPresetId={selectedPreset}
      onSelectPreset={(preset) => {
        setSelectedPreset(preset.id)
        // Apply preset settings
      }}
    />
  )
}
```

### Export Settings Hook

```typescript
import { useExportSettings } from '@/features/export'

const {
  getCurrentSettings,   // Get current settings
  updateSettings,       // Update settings
  handleChooseFolder,   // Choose save folder
  getExportConfig      // Get render configuration
} = useExportSettings()
```

### Social Media Export

```typescript
import { useSocialExport } from '@/features/export'

const {
  authorize,           // OAuth authorization
  uploadVideo,        // Upload to platform
  isAuthorized       // Check auth status
} = useSocialExport('youtube')
```

## Integration

- **Depends on**: `@/features/timeline`, `@/domains/video-compiler`
- **Used by**: `@/features/media-studio`

## Testing

- **Total tests**: 40+
- **Coverage**: ~90%
  - ExportModal: 21 tests
  - LocalExportTab: 14 tests
  - useExportSettings: 7 tests
  - Services: 59 tests (OAuth, Social Networks, TikTok)
  - Constants: 18 tests
- **Run tests**: `bun test src/features/export`

## Export Presets

### Professional Presets
- **Custom Export** - Manual configuration of all parameters
- **H.264 Master** - High quality H.264 for archive (80 Mbps CBR)
- **H.265 Master** - High quality H.265/HEVC (60 Mbps VBR)
- **ProRes 422 HQ** - Apple ProRes for professional editing
- **HyperDeck** - Blackmagic HyperDeck format (50 Mbps CBR)

### Social Media Presets
- **YouTube 1080p** - Optimized for YouTube (12 Mbps VBR, -14 LKFS)
- **Vimeo 1080p** - High quality for Vimeo (20 Mbps VBR)
- **TikTok 1080p** - Vertical video for TikTok (auto bitrate)

### Resolutions
- **4K (2160p)**: 3840x2160
- **QHD (1440p)**: 2560x1440
- **Full HD (1080p)**: 1920x1080
- **HD (720p)**: 1280x720
- **Timeline** - Use project resolution

## TODO / Roadmap

- [ ] Advanced audio export settings (multi-track, channel mapping)
- [ ] Timecode burn-in options for professional workflows
- [ ] HDR export support (HDR10, Dolby Vision)
- [ ] Custom watermark overlay
- [ ] E2E tests - comprehensive test suite (see E2E Tests section in old README)
- [ ] Export queue persistence (save/restore queue on app restart)
- [ ] Export templates (save complete export configurations)

## Documentation

- **README.md** - This file (EN)
- **README.ru.md** - Russian version
