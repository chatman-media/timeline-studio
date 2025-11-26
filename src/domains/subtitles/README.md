# Subtitles Domain

Централизованная работа с субтитрами: импорт файлов и синхронизация с аудио в Timeline Studio.

## Quick Start

```typescript
import { subtitleService } from "@/domains/subtitles"

async function importSubtitles() {
  // Импорт файла субтитров
  const result = await subtitleService.importSubtitleFile("/path/to/subtitle.srt")
  console.log("Imported:", result.file_name, result.format)
  console.log("Content:", result.content)

  // Анализ аудио для синхронизации
  const peaks = await subtitleService.analyzeAudioForSync("/path/to/video.mp4", {
    windowSize: 1024,
    hopSize: 512,
    threshold: 0.5
  })
  console.log("Audio peaks:", peaks.peaks.length)

  // Получить поддерживаемые форматы
  const formats = subtitleService.getSupportedFormats()
  console.log("Supported:", formats) // ["srt", "vtt", "ass", "ssa"]
}
```

## Public API

### Services
| Service | Purpose |
|---------|---------|
| `subtitleService` | Singleton для работы с субтитрами |

### Types
| Type | Purpose |
|------|---------|
| `SubtitleImportResult` | Результат импорта субтитров |
| `AudioPeaksResult` | Результат анализа аудио пиков |
| `AudioAnalysisOptions` | Опции анализа аудио |

### Tauri Commands (Advanced)
| Command | Purpose |
|---------|---------|
| `readSubtitleFile(path)` | Чтение файла субтитров через Rust backend |
| `analyzeAudioPeaks(path, options)` | Анализ аудио пиков через FFmpeg |

## Supported Formats

- **SRT** - SubRip Text (most common)
- **VTT** - WebVTT (web standard)
- **ASS** - Advanced SubStation Alpha (styled)
- **SSA** - SubStation Alpha (legacy styled)

## Key Features

- **Multi-format Import** - Support for SRT, VTT, ASS, SSA
- **Audio Synchronization** - Detect audio peaks for subtitle timing alignment
- **Rust Backend** - Fast file reading and audio analysis via Tauri
- **Singleton Pattern** - Simple API through `subtitleService`
- **Type Safety** - Full TypeScript typing

## Dependencies

**Internal:**
- `@/lib/tauri-logger` - Structured logging

**External:**
- `@tauri-apps/api/core` - Tauri IPC

## Testing

```bash
# Unit tests (when available)
bun run test src/domains/subtitles/__tests__/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Complete API documentation |
| [Architecture](./docs/ARCHITECTURE.md) | Architecture, design decisions |
| [Changelog](./docs/CHANGELOG.md) | History of changes |
