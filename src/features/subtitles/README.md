# Subtitles

**English** | [Русский](./README.ru.md)

## Overview

Professional subtitle styles system with 72 built-in styles across 6 categories. Features CSS animations, AI transcription, automatic audio sync, and complete SRT/VTT/ASS format support for import and export.

## Status

- ✅ **Components**: 9 components for subtitle management and editing
- ✅ **Hooks**: 5 hooks for styles, import, export, and management
- ✅ **Utilities**: 5 utilities for processing, parsing, and exporting
- ✅ **Tests**: 17 test files, 100% passing
- ✅ **Styles**: 72 professional subtitle styles (12 per category)

## Structure

```
subtitles/
├── components/                      # React components (9 files)
│   ├── subtitle-ai-tools.tsx       # AI tools for subtitles
│   ├── subtitle-ai-tools-modal.tsx # AI tools modal
│   ├── subtitle-auto-sync.tsx      # Auto sync with audio
│   ├── subtitle-group.tsx          # Category grouping
│   ├── subtitle-import-button.tsx  # Import button
│   ├── subtitle-preview.tsx        # Style preview
│   ├── subtitle-sync-tools.tsx     # Sync tools
│   ├── subtitle-toolbar.tsx        # Toolbar
│   └── subtitle-tools.tsx          # General tools
├── hooks/                          # React hooks (5 files)
│   ├── use-subtitle-styles.ts      # Load styles from JSON
│   ├── use-subtitle-style-manager.ts # Style management
│   ├── use-subtitles-import.ts     # Import functionality
│   └── use-subtitles-export.ts     # Export functionality
├── utils/                          # Utilities (5 files)
│   ├── css-styles.ts               # CSS utilities
│   ├── subtitle-processor.ts       # Data processing
│   ├── subtitle-parsers.ts         # SRT/VTT/ASS parsers
│   ├── subtitle-exporters.ts       # Export to formats
│   └── subtitle-importers.ts       # Import through Tauri
├── data/                           # JSON data (2 files)
│   ├── subtitle-styles.json        # 72 professional styles
│   └── subtitle-categories.json    # 6 categories with translations
├── types/                          # TypeScript types
│   └── subtitles.ts                # Main interfaces
└── __tests__/                      # Tests (17 files)
```

## Features

### ✅ Implemented

- [x] **72 Subtitle Styles**: 12 styles in each of 6 categories
- [x] **Categories**: Basic, Cinematic, Stylized, Minimal, Animated, Modern
- [x] **Import/Export**: Full SRT, VTT, ASS format support
- [x] **AI Transcription**: OpenAI Whisper integration
- [x] **Auto Sync**: Automatic synchronization with audio
- [x] **CSS Animations**: Dynamic subtitle effects
- [x] **Style Preview**: Demo text with applied styles
- [x] **Internationalization**: 15 language support
- [x] **Timeline Integration**: Full timeline editing support

### ❌ Not Implemented

- [ ] Real-time animated previews
- [ ] Visual style editor
- [ ] Cloud subtitle storage

## Usage

### Load Subtitle Styles

```typescript
import { useSubtitles } from '@/features/subtitles'

function MyComponent() {
  const { subtitles: styles, loading, error, reload, isReady } = useSubtitles()

  if (loading) return <div>Loading styles...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Available styles: {styles.length}</h2>
      {styles.map(style => (
        <div key={style.id}>
          {style.labels.ru} ({style.category})
        </div>
      ))}
    </div>
  )
}
```

### Style Management

```typescript
import { useSubtitleStyles } from '@/features/subtitles'

function StyleManager() {
  const {
    subtitleStyles,
    getStyleById,
    getComputedStyle,
    getDefaultStyle
  } = useSubtitleStyles()

  const defaultStyle = getDefaultStyle()
  const computed = getComputedStyle('basic-white', { fontSize: 32 })

  return (
    <div>
      <h3>Default style: {defaultStyle?.name}</h3>
      <p>Computed font size: {computed.fontSize}px</p>
    </div>
  )
}
```

### Import Subtitles

```typescript
import { useSubtitlesImport } from '@/features/subtitles'

function ImportButton() {
  const { importSubtitleFile, isImporting } = useSubtitlesImport()

  const handleImport = async () => {
    await importSubtitleFile() // Auto-detects format
  }

  return (
    <button onClick={handleImport} disabled={isImporting}>
      Import Subtitles
    </button>
  )
}
```

### Export Subtitles

```typescript
import { useSubtitlesExport } from '@/features/subtitles'

function ExportButton() {
  const {
    exportSubtitleFile,
    exportSelectedSubtitles,
    exportSubtitlesByTimeRange,
    isExporting
  } = useSubtitlesExport()

  return (
    <div>
      <button
        onClick={() => exportSubtitleFile('srt')}
        disabled={isExporting}
      >
        Export to SRT
      </button>
    </div>
  )
}
```

## Integration

- **Depends on**: @/domains/resources, @/features/timeline
- **Used by**: Timeline, Media Studio, VideoPlayer
- **Resources**: Integrated with ResourcesProvider and BrowserStateProvider

## Testing

- **Total tests**: 17 test files
- **Coverage**: ~70% overall
- **Categories**:
  - Components: 5 test files
  - Hooks: 3 test files
  - Utilities: 5 test files
  - Types: 1 test file
  - Data: 1 test file

```bash
# Run all subtitle tests
bun run test src/features/subtitles

# Run specific test category
bun run test src/features/subtitles/__tests__/components/
bun run test src/features/subtitles/__tests__/hooks/
bun run test src/features/subtitles/__tests__/utils/
```

## TODO / Roadmap

- [ ] Add real-time animated subtitle previews
- [ ] Implement visual style editor for custom styles
- [ ] Add more export formats (SBV, TTML)
- [ ] Optimize WebWorker for large subtitle files
- [ ] Add subtitle versioning and history
- [ ] Implement cloud storage and synchronization
